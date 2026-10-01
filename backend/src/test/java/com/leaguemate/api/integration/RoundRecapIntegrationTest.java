package com.leaguemate.api.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leaguemate.api.dto.CreateTeamRequest;
import com.leaguemate.api.dto.CreateTournamentRequest;
import com.leaguemate.api.dto.LoginRequest;
import com.leaguemate.api.dto.UpdateMatchResultRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.ai.enabled=true",
        "app.ai.base-url=http://localhost:1",
        "app.ai.connect-timeout=1s"
})
@DisplayName("Integrazione - Cronaca AI della giornata con Ollama non raggiungibile")
class RoundRecapIntegrationTest {

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
    private String playerToken;
    private Long tournamentId;
    private Long matchId;

    @BeforeEach
    void setUp() throws Exception {
        recapRepository.deleteAll();
        matchRepository.deleteAll();
        registrationRepository.deleteAll();
        teamMemberRepository.deleteAll();
        tournamentRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();

        persistUser("organizer", Role.ORGANIZER);
        persistUser("player", Role.USER);
        organizerToken = obtainToken("organizer");
        playerToken = obtainToken("player");

        tournamentId = createAsOrganizer("/api/tournaments", new CreateTournamentRequest("Recap Cup", "2026/2027"));
        Long home = createAsOrganizer("/api/teams", new CreateTeamRequest("Straw Hat FC", null));
        Long away = createAsOrganizer("/api/teams", new CreateTeamRequest("Heart Pirates", null));
        for (Long teamId : new Long[]{home, away}) {
            mockMvc.perform(post("/api/tournaments/" + tournamentId + "/register-team/" + teamId)
                            .header("Authorization", "Bearer " + organizerToken))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(post("/api/tournaments/" + tournamentId + "/generate-rounds")
                        .header("Authorization", "Bearer " + organizerToken))
                .andExpect(status().isOk());

        String rounds = mockMvc.perform(get("/api/tournaments/" + tournamentId + "/rounds")
                        .header("Authorization", "Bearer " + organizerToken))
                .andReturn().getResponse().getContentAsString();
        matchId = objectMapper.readTree(rounds).get(0).get("matches").get(0).get("id").asLong();
    }

    @Test
    @DisplayName("Senza token → 401")
    void getRecap_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get(recapUrl(1)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Giornata non ancora completa → 200 con NOT_AVAILABLE")
    void getRecap_RoundNotComplete_ReturnsNotAvailable() throws Exception {
        mockMvc.perform(get(recapUrl(1)).header("Authorization", "Bearer " + playerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NOT_AVAILABLE"))
                .andExpect(jsonPath("$.content").doesNotExist());
    }

    @Test
    @DisplayName("Giornata inesistente → 404")
    void getRecap_UnknownRound_Returns404() throws Exception {
        mockMvc.perform(get(recapUrl(99)).header("Authorization", "Bearer " + playerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Un USER non può rigenerare la cronaca → 403")
    void regenerate_AsUser_Returns403() throws Exception {
        mockMvc.perform(post(recapUrl(1)).header("Authorization", "Bearer " + playerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Rigenerare una giornata non completa → 409")
    void regenerate_RoundNotComplete_Returns409() throws Exception {
        mockMvc.perform(post(recapUrl(1)).header("Authorization", "Bearer " + organizerToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Ultimo risultato salvato subito; con Ollama spento la cronaca va in FAILED, mai 500")
    void lastResult_TriggersRecap_FailsGracefully() throws Exception {
        mockMvc.perform(put("/api/matches/" + matchId + "/result")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateMatchResultRequest(2, 1))))
                .andExpect(status().isOk());

        assertEquals("FAILED", waitForFinalStatus());

        mockMvc.perform(post(recapUrl(1)).header("Authorization", "Bearer " + organizerToken))
                .andExpect(status().isAccepted());

        assertEquals("FAILED", waitForFinalStatus());
    }

    private String waitForFinalStatus() throws Exception {
        for (int attempt = 0; attempt < 50; attempt++) {
            String body = mockMvc.perform(get(recapUrl(1)).header("Authorization", "Bearer " + playerToken))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            String recapStatus = objectMapper.readTree(body).get("status").asText();
            if (!recapStatus.equals("PENDING") && !recapStatus.equals("NOT_AVAILABLE")) {
                return recapStatus;
            }
            Thread.sleep(200);
        }
        return "TIMEOUT";
    }

    private String recapUrl(int roundNumber) {
        return "/api/tournaments/" + tournamentId + "/rounds/" + roundNumber + "/recap";
    }

    private Long createAsOrganizer(String url, Object request) throws Exception {
        String body = mockMvc.perform(post(url)
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return json.get("id").asLong();
    }

    private void persistUser(String username, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@leaguemate.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setFirstName("Nome");
        user.setLastName("Cognome");
        user.setRole(role);
        userRepository.save(user);
    }

    private String obtainToken(String username) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(username, "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("access_token").asText();
    }
}
