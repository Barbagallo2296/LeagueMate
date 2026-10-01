package com.leaguemate.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leaguemate.api.dto.AssistantRequest;
import com.leaguemate.api.dto.CreateTournamentRequest;
import com.leaguemate.api.dto.LoginRequest;
import com.leaguemate.api.entity.Role;
import com.leaguemate.api.entity.User;
import com.leaguemate.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.ai.assistant.rate-limit.capacity=3")
@DisplayName("Integrazione - Assistente del torneo con AI disattivata")
class AssistantIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private AiRoundRecapRepository recapRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String organizerToken;
    private Long tournamentId;

    @BeforeEach
    void setUp() throws Exception {
        recapRepository.deleteAll();
        matchRepository.deleteAll();
        registrationRepository.deleteAll();
        teamMemberRepository.deleteAll();
        tournamentRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();

        String username = "organizer-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@leaguemate.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Nome");
        user.setLastName("Cognome");
        user.setRole(Role.ORGANIZER);
        userRepository.save(user);

        String login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(username, "password123"))))
                .andReturn().getResponse().getContentAsString();
        organizerToken = objectMapper.readTree(login).get("access_token").asText();

        String created = mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTournamentRequest("Assistant Cup", "2026/2027"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        tournamentId = objectMapper.readTree(created).get("id").asLong();
    }

    @Test
    @DisplayName("Senza token → 401")
    void ask_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(post("/api/tournaments/" + tournamentId + "/assistant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssistantRequest("chi è primo?"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Domanda vuota o oltre 300 caratteri → 400")
    void ask_InvalidQuestion_Returns400() throws Exception {
        ask(tournamentId, "   ").andExpect(status().isBadRequest());
        ask(tournamentId, "a".repeat(301)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Torneo inesistente → 404")
    void ask_UnknownTournament_Returns404() throws Exception {
        ask(999_999L, "chi è primo?").andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("AI disattivata → 200 con stato UNAVAILABLE, mai 500")
    void ask_AiDisabled_ReturnsUnavailable() throws Exception {
        ask(tournamentId, "chi è primo?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value("AI features are disabled"));
    }

    @Test
    @DisplayName("Oltre il limite di domande per utente → 429 con Retry-After")
    void ask_OverRateLimit_Returns429() throws Exception {
        for (int i = 0; i < 3; i++) {
            ask(tournamentId, "domanda " + i).andExpect(status().isOk());
        }
        ask(tournamentId, "una di troppo")
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));
    }

    private ResultActions ask(Long id, String question) throws Exception {
        return mockMvc.perform(post("/api/tournaments/" + id + "/assistant")
                .header("Authorization", "Bearer " + organizerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new AssistantRequest(question))));
    }
}
