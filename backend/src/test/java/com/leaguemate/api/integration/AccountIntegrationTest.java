package com.leaguemate.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leaguemate.api.dto.ChangePasswordRequest;
import com.leaguemate.api.dto.LoginRequest;
import com.leaguemate.api.dto.UpdateAccountRequest;
import com.leaguemate.api.entity.Role;
import com.leaguemate.api.entity.User;
import com.leaguemate.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Integrazione - Modifica dei dati dell'account e della password")
class AccountIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        persistUser("nami", "nami@leaguemate.com");
        persistUser("robin", "robin@leaguemate.com");
    }

    private void persistUser(String username, String email) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Nome");
        user.setLastName("Cognome");
        user.setRole(Role.USER);
        userRepository.save(user);
    }

    private int loginStatus(String username, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(username, password))))
                .andReturn()
                .getResponse()
                .getStatus();
    }

    private String obtainToken(String username, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(username, password))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(body).get("access_token").asText();
    }

    @Test
    @DisplayName("PUT /users/me aggiorna nome, cognome ed email dell'utente collegato")
    void updateAccount_UpdatesCurrentUser() throws Exception {
        String token = obtainToken("nami", "password123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateAccountRequest("Nami", "Navigatrice", "nami@thousand-sunny.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Nami"))
                .andExpect(jsonPath("$.email").value("nami@thousand-sunny.com"));

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName").value("Navigatrice"))
                .andExpect(jsonPath("$.username").value("nami"));
    }

    @Test
    @DisplayName("PUT /users/me con l'email di un altro utente restituisce 409")
    void updateAccount_EmailOfAnotherUser_ReturnsConflict() throws Exception {
        String token = obtainToken("nami", "password123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateAccountRequest("Nami", "Cognome", "robin@leaguemate.com"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    @DisplayName("PUT /users/me con dati non validi restituisce 400")
    void updateAccount_InvalidData_ReturnsBadRequest() throws Exception {
        String token = obtainToken("nami", "password123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateAccountRequest("", "Cognome", "non-una-email"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cambio password: con la password attuale sbagliata restituisce 400")
    void changePassword_WrongCurrentPassword_ReturnsBadRequest() throws Exception {
        String token = obtainToken("nami", "password123");

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ChangePasswordRequest("sbagliata", "nuovaPassword1"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }

    @Test
    @DisplayName("Cambio password: vale la nuova password e le sessioni aperte vengono chiuse")
    void changePassword_RevokesSessionsAndUsesNewPassword() throws Exception {
        String token = obtainToken("nami", "password123");

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ChangePasswordRequest("password123", "nuovaPassword1"))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());

        assertEquals(401, loginStatus("nami", "password123"));
        assertEquals(200, loginStatus("nami", "nuovaPassword1"));
    }

    @Test
    @DisplayName("Senza token le modifiche all'account restituiscono 401")
    void accountEndpoints_WithoutToken_ReturnUnauthorized() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateAccountRequest("Nami", "Cognome", "nami@leaguemate.com"))))
                .andExpect(status().isUnauthorized());
    }
}
