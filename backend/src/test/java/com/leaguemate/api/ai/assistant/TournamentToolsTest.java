package com.leaguemate.api.ai.assistant;

import com.leaguemate.api.ai.client.ToolCall;
import com.leaguemate.api.ai.client.ToolDefinition;
import com.leaguemate.api.dto.StandingEntry;
import com.leaguemate.api.dto.TournamentStatsResponse;
import com.leaguemate.api.entity.Match;
import com.leaguemate.api.entity.MatchStatus;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.entity.Team;
import com.leaguemate.api.service.TournamentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TournamentTools - strumenti in sola lettura dell'assistente")
class TournamentToolsTest {

    @Mock
    private TournamentService tournamentService;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private TournamentTools tools;

    private final Team heart = team(1, "Heart Pirates");
    private final Team kid = team(2, "Kid Pirates");

    @BeforeEach
    void setUp() {
        tools = new TournamentTools(tournamentService, jsonMapper);
    }

    @Test
    @DisplayName("Quattro tool, con i nomi delle squadre come enum di get_team_matches")
    @SuppressWarnings("unchecked")
    void definitions_ContainFourToolsAndTeamEnum() {
        List<ToolDefinition> definitions = tools.definitions(List.of("Heart Pirates", "Kid Pirates"), 7);

        assertEquals(List.of("get_standings", "get_tournament_stats", "get_round", "get_team_matches"),
                definitions.stream().map(ToolDefinition::name).toList());
        Map<String, Object> properties = (Map<String, Object>) definitions.get(3).parameters().get("properties");
        Map<String, Object> teamName = (Map<String, Object>) properties.get("team_name");
        assertEquals(List.of("Heart Pirates", "Kid Pirates"), teamName.get("enum"));
    }

    @Test
    @DisplayName("get_standings: classifica con posizione e campi in italiano")
    void standings_ReturnsRows() {
        when(tournamentService.calculateStandings(2L)).thenReturn(List.of(
                new StandingEntry("Heart Pirates", 3, 1, 0, 0, 3, 2, 1)));

        JsonNode json = run(noArguments("get_standings"));

        assertEquals(1, json.get(0).get("posizione").asInt());
        assertEquals("Heart Pirates", json.get(0).get("squadra").asString());
        assertEquals(3, json.get(0).get("punti").asInt());
    }

    @Test
    @DisplayName("get_standings: nessuna partita giocata → nota senza posizioni, nessuna squadra in testa")
    void standings_NoMatchesPlayed_ReturnsNote() {
        when(tournamentService.calculateStandings(2L)).thenReturn(List.of(
                new StandingEntry("Heart Pirates", 0, 0, 0, 0, 0, 0, 0),
                new StandingEntry("Kid Pirates", 0, 0, 0, 0, 0, 0, 0)));

        JsonNode json = run(noArguments("get_standings"));

        assertFalse(json.isArray());
        assertEquals(TournamentTools.NO_MATCHES_PLAYED, json.get("nota").asString());
    }

    @Test
    @DisplayName("get_tournament_stats: statistiche con miglior attacco già scritto")
    void stats_ReturnsSummary() {
        when(tournamentService.getTournamentStats(2L)).thenReturn(
                new TournamentStatsResponse(2L, "New World League", 8, 28, 16, 12, 40, 2.5, "Straw Hat FC", 8));

        JsonNode json = run(noArguments("get_tournament_stats"));

        assertEquals(12, json.get("partite_da_giocare").asInt());
        assertEquals("Straw Hat FC (8 gol)", json.get("miglior_attacco").asString());
    }

    @Test
    @DisplayName("get_tournament_stats: miglior difesa già calcolata dal backend, al singolare")
    void stats_IncludesBestDefense() {
        when(tournamentService.getTournamentStats(2L)).thenReturn(
                new TournamentStatsResponse(2L, "New World League", 3, 6, 4, 2, 9, 2.25, "Heart Pirates", 5));
        when(tournamentService.calculateStandings(2L)).thenReturn(List.of(
                new StandingEntry("Heart Pirates", 6, 2, 0, 1, 5, 3, 2),
                new StandingEntry("Marine Ford", 4, 1, 1, 0, 2, 1, 1),
                new StandingEntry("Kid Pirates", 0, 0, 0, 2, 2, 5, -3)));

        JsonNode json = run(noArguments("get_tournament_stats"));

        assertEquals("Marine Ford (1 gol subito)", json.get("miglior_difesa").asString());
    }

    @Test
    @DisplayName("get_tournament_stats: miglior difesa a pari merito elenca tutte le squadre")
    void stats_BestDefenseTie_ListsAllTeams() {
        when(tournamentService.getTournamentStats(2L)).thenReturn(
                new TournamentStatsResponse(2L, "New World League", 3, 6, 3, 3, 6, 2.0, "Heart Pirates", 3));
        when(tournamentService.calculateStandings(2L)).thenReturn(List.of(
                new StandingEntry("Heart Pirates", 3, 1, 0, 1, 3, 2, 1),
                new StandingEntry("Marine Ford", 3, 1, 0, 1, 2, 2, 0),
                new StandingEntry("Kid Pirates", 3, 1, 0, 1, 1, 2, -1)));

        JsonNode json = run(noArguments("get_tournament_stats"));

        assertEquals("Heart Pirates, Marine Ford e Kid Pirates (2 gol subiti)", json.get("miglior_difesa").asString());
    }

    @Test
    @DisplayName("get_tournament_stats: senza partite giocate la miglior difesa non compare")
    void stats_NoMatchesPlayed_HasNoBestDefense() {
        when(tournamentService.getTournamentStats(2L)).thenReturn(
                new TournamentStatsResponse(2L, "Grand Line Cup", 2, 0, 0, 0, 0, 0.0, null, 0));
        when(tournamentService.calculateStandings(2L)).thenReturn(List.of(
                new StandingEntry("Heart Pirates", 0, 0, 0, 0, 0, 0, 0),
                new StandingEntry("Kid Pirates", 0, 0, 0, 0, 0, 0, 0)));

        JsonNode json = run(noArguments("get_tournament_stats"));

        assertFalse(json.has("miglior_difesa"));
    }

    @Test
    @DisplayName("get_round: risultato già scritto in italiano, 'da giocare' per le partite future")
    void round_DescribesResults() {
        when(tournamentService.getRounds(2L)).thenReturn(List.of(
                round(1, played(kid, heart, 2, 3), scheduled(heart, kid))));

        JsonNode json = run(new ToolCall("1", "get_round", Map.of("round_number", 1)));

        assertEquals("Heart Pirates batte Kid Pirates 3-2 (vittoria in trasferta)",
                json.get("partite").get(0).get("risultato").asString());
        assertEquals("da giocare", json.get("partite").get(1).get("risultato").asString());
    }

    @Test
    @DisplayName("get_round: numero passato come testo accettato")
    void round_AcceptsNumberAsString() {
        when(tournamentService.getRounds(2L)).thenReturn(List.of(round(1, scheduled(heart, kid))));

        JsonNode json = run(new ToolCall("1", "get_round", Map.of("round_number", "1")));

        assertEquals(1, json.get("giornata").asInt());
    }

    @Test
    @DisplayName("get_round: giornata inesistente o argomento non valido → error")
    void round_InvalidArguments_ReturnError() {
        when(tournamentService.getRounds(2L)).thenReturn(List.of(round(1, scheduled(heart, kid))));

        assertTrue(run(new ToolCall("1", "get_round", Map.of("round_number", 9))).get("error").asString()
                .contains("non esiste"));
        assertTrue(run(new ToolCall("1", "get_round", Map.of("round_number", "abc"))).has("error"));
        assertTrue(run(new ToolCall("1", "get_round", Map.of())).has("error"));
    }

    @Test
    @DisplayName("get_team_matches: nome senza distinzione di maiuscole, solo le partite della squadra")
    void teamMatches_CaseInsensitive() {
        Team redHair = team(3, "Red Hair United");
        when(tournamentService.getRegisteredTeams(2L)).thenReturn(List.of(heart, kid, redHair));
        when(tournamentService.getRounds(2L)).thenReturn(List.of(
                round(1, played(heart, kid, 1, 0)),
                round(2, scheduled(redHair, kid)),
                round(3, scheduled(redHair, heart))));

        JsonNode json = run(new ToolCall("1", "get_team_matches", Map.of("team_name", "heart PIRATES")));

        assertEquals("Heart Pirates", json.get("squadra").asString());
        assertEquals(2, json.get("partite").size());
        assertEquals(3, json.get("partite").get(1).get("giornata").asInt());
    }

    @Test
    @DisplayName("get_team_matches: squadra non iscritta → error")
    void teamMatches_UnknownTeam_ReturnsError() {
        when(tournamentService.getRegisteredTeams(2L)).thenReturn(List.of(heart, kid));

        JsonNode json = run(new ToolCall("1", "get_team_matches", Map.of("team_name", "Juventus")));

        assertTrue(json.get("error").asString().contains("non è iscritta"));
    }

    @Test
    @DisplayName("Tool sconosciuto o errore del servizio → error, mai un'eccezione")
    void unknownToolOrServiceError_ReturnError() {
        when(tournamentService.calculateStandings(2L)).thenThrow(new IllegalStateException("db down"));

        assertTrue(run(noArguments("delete_everything")).get("error").asString().contains("sconosciuto"));
        assertTrue(run(noArguments("get_standings")).has("error"));
    }

    private JsonNode run(ToolCall call) {
        return jsonMapper.readTree(tools.execute(2L, call));
    }

    private static ToolCall noArguments(String name) {
        return new ToolCall("1", name, Map.of());
    }

    private static Team team(long id, String name) {
        Team team = new Team();
        team.setId(id);
        team.setName(name);
        return team;
    }

    private static Round round(int number, Match... matches) {
        Round round = new Round();
        round.setRoundNumber(number);
        round.setMatches(new ArrayList<>(List.of(matches)));
        return round;
    }

    private static Match played(Team home, Team away, int homeScore, int awayScore) {
        Match match = scheduled(home, away);
        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setStatus(MatchStatus.COMPLETED);
        return match;
    }

    private static Match scheduled(Team home, Team away) {
        Match match = new Match();
        match.setHomeTeam(home);
        match.setAwayTeam(away);
        match.setStatus(MatchStatus.SCHEDULED);
        return match;
    }
}
