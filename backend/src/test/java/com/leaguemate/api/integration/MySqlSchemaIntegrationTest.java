package com.leaguemate.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leaguemate.api.dto.LoginRequest;
import com.leaguemate.api.dto.StandingEntry;
import com.leaguemate.api.entity.AiRoundRecap;
import com.leaguemate.api.entity.RecapStatus;
import com.leaguemate.api.repository.AiRoundRecapRepository;
import com.leaguemate.api.repository.RoundRepository;
import com.leaguemate.api.service.TournamentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = {
        "spring.flyway.locations=classpath:db/migration,classpath:db/demo",
        "app.ai.enabled=false"
})
@DisplayName("Integrazione - Migrazioni Flyway e dati demo su MySQL 8 reale")
class MySqlSchemaIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer mysql = new MySQLContainer("mysql:8.0");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TournamentService tournamentService;

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private AiRoundRecapRepository recapRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Schema validato da Hibernate e torneo demo giocabile dall'organizzatore")
    void migrationsAndDemoData_WorkOnMySql() throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("law_organizer", "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(body).get("access_token").asText();

        mockMvc.perform(post("/api/tournaments/1/generate-rounds")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tournaments/1/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registeredTeams").value(4))
                .andExpect(jsonPath("$.totalMatches").value(6));

        mockMvc.perform(get("/api/tournaments?sort=name,asc")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
    }

    @Test
    @DisplayName("Torneo demo in corso: classifica attuale e classifica fino alla giornata 3")
    void demoActiveTournament_StandingsUpToRound() {
        List<StandingEntry> current = tournamentService.calculateStandings(2L);
        List<StandingEntry> afterRoundThree = tournamentService.calculateStandingsUpToRound(2L, 3);

        assertEquals(8, current.size());
        assertEquals("Marine Ford", current.getFirst().teamName());
        assertEquals(10, current.getFirst().points());
        assertEquals(7, afterRoundThree.stream()
                .filter(entry -> entry.teamName().equals("Marine Ford"))
                .findFirst().orElseThrow().points());
    }

    @Test
    @DisplayName("Tabella ai_round_recaps (V6): salvataggio e lettura su MySQL")
    void aiRoundRecaps_PersistOnMySql() {
        AiRoundRecap recap = new AiRoundRecap();
        recap.setRound(roundRepository.findByTournamentIdAndRoundNumber(2L, 3).orElseThrow());
        recap.setStatus(RecapStatus.READY);
        recap.setContent("x".repeat(2000));
        recap.setModel("qwen3.5:4b");
        recap.setGeneratedAt(LocalDateTime.now());
        recapRepository.save(recap);

        AiRoundRecap saved = recapRepository.findByRoundId(recap.getRound().getId()).orElseThrow();
        assertEquals(RecapStatus.READY, saved.getStatus());
        assertEquals(2000, saved.getContent().length());
        recapRepository.delete(saved);
    }
}
