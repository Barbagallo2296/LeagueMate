package com.leaguemate.api.ai.assistant;

import com.leaguemate.api.ai.client.ToolCall;
import com.leaguemate.api.ai.client.ToolDefinition;
import com.leaguemate.api.ai.recap.RoundFactsBuilder;
import com.leaguemate.api.dto.StandingEntry;
import com.leaguemate.api.dto.TournamentStatsResponse;
import com.leaguemate.api.entity.Match;
import com.leaguemate.api.entity.MatchStatus;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.entity.Team;
import com.leaguemate.api.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TournamentTools {

    public static final String GET_STANDINGS = "get_standings";
    public static final String GET_TOURNAMENT_STATS = "get_tournament_stats";
    public static final String GET_ROUND = "get_round";
    public static final String GET_TEAM_MATCHES = "get_team_matches";

    private final TournamentService tournamentService;
    private final JsonMapper jsonMapper;

    public List<ToolDefinition> definitions(List<String> teamNames, int totalRounds) {
        return List.of(
                new ToolDefinition(GET_STANDINGS,
                        "Classifica attuale del torneo: posizione, squadra, punti, vittorie, pareggi, sconfitte, "
                                + "gol fatti e gol subiti.",
                        objectSchema(Map.of(), List.of())),
                new ToolDefinition(GET_TOURNAMENT_STATS,
                        "Statistiche del torneo: squadre iscritte, partite giocate e da giocare, gol totali, "
                                + "media gol a partita e miglior attacco.",
                        objectSchema(Map.of(), List.of())),
                new ToolDefinition(GET_ROUND,
                        "Partite di una giornata con i risultati (o 'da giocare').",
                        objectSchema(Map.of("round_number", Map.of(
                                "type", "integer",
                                "description", "Numero della giornata, da 1 a " + totalRounds)),
                                List.of("round_number"))),
                new ToolDefinition(GET_TEAM_MATCHES,
                        "Tutte le partite di una squadra, giocate e da giocare, con giornata e risultato.",
                        objectSchema(Map.of("team_name", Map.of(
                                "type", "string",
                                "description", "Nome della squadra",
                                "enum", teamNames)),
                                List.of("team_name"))));
    }

    public String execute(Long tournamentId, ToolCall call) {
        try {
            Object result = switch (call.name()) {
                case GET_STANDINGS -> standings(tournamentId);
                case GET_TOURNAMENT_STATS -> stats(tournamentId);
                case GET_ROUND -> round(tournamentId, call.arguments().get("round_number"));
                case GET_TEAM_MATCHES -> teamMatches(tournamentId, call.arguments().get("team_name"));
                default -> error("Tool sconosciuto: " + call.name());
            };
            return jsonMapper.writeValueAsString(result);
        } catch (RuntimeException ex) {
            return jsonMapper.writeValueAsString(error("Dati non disponibili per questa richiesta"));
        }
    }

    private List<Map<String, Object>> standings(Long tournamentId) {
        List<StandingEntry> standings = tournamentService.calculateStandings(tournamentId);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int i = 0; i < standings.size(); i++) {
            StandingEntry entry = standings.get(i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("posizione", i + 1);
            row.put("squadra", entry.teamName());
            row.put("punti", entry.points());
            row.put("vittorie", entry.wins());
            row.put("pareggi", entry.draws());
            row.put("sconfitte", entry.losses());
            row.put("gol_fatti", entry.goalsFor());
            row.put("gol_subiti", entry.goalsAgainst());
            rows.add(row);
        }
        return rows;
    }

    private Map<String, Object> stats(Long tournamentId) {
        TournamentStatsResponse stats = tournamentService.getTournamentStats(tournamentId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("squadre_iscritte", stats.registeredTeams());
        result.put("partite_totali", stats.totalMatches());
        result.put("partite_giocate", stats.playedMatches());
        result.put("partite_da_giocare", stats.remainingMatches());
        result.put("gol_totali", stats.totalGoals());
        result.put("media_gol_a_partita", stats.averageGoalsPerMatch());
        result.put("miglior_attacco", stats.topScoringTeam() != null
                ? stats.topScoringTeam() + " (" + stats.topScoringTeamGoals() + " gol)"
                : "nessun gol segnato");
        return result;
    }

    private Map<String, Object> round(Long tournamentId, Object roundArgument) {
        Optional<Integer> roundNumber = parseInteger(roundArgument);
        if (roundNumber.isEmpty()) {
            return error("round_number deve essere un numero intero");
        }
        List<Round> rounds = tournamentService.getRounds(tournamentId);
        return rounds.stream()
                .filter(round -> round.getRoundNumber() == roundNumber.get())
                .findFirst()
                .map(round -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("giornata", round.getRoundNumber());
                    result.put("partite", round.getMatches().stream().map(TournamentTools::describeMatch).toList());
                    return result;
                })
                .orElseGet(() -> error("La giornata " + roundNumber.get() + " non esiste: il torneo ha "
                        + rounds.size() + " giornate"));
    }

    private Map<String, Object> teamMatches(Long tournamentId, Object teamArgument) {
        if (!(teamArgument instanceof String requested) || requested.isBlank()) {
            return error("team_name è obbligatorio");
        }
        Optional<String> teamName = tournamentService.getRegisteredTeams(tournamentId).stream()
                .map(Team::getName)
                .filter(name -> name.equalsIgnoreCase(requested.strip()))
                .findFirst();
        if (teamName.isEmpty()) {
            return error("La squadra '" + requested + "' non è iscritta a questo torneo");
        }

        List<Map<String, Object>> matches = new ArrayList<>();
        for (Round round : tournamentService.getRounds(tournamentId)) {
            for (Match match : round.getMatches()) {
                if (match.getHomeTeam().getName().equals(teamName.get())
                        || match.getAwayTeam().getName().equals(teamName.get())) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("giornata", round.getRoundNumber());
                    row.putAll(describeMatch(match));
                    matches.add(row);
                }
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("squadra", teamName.get());
        result.put("partite", matches);
        return result;
    }

    private static Map<String, Object> describeMatch(Match match) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("casa", match.getHomeTeam().getName());
        row.put("trasferta", match.getAwayTeam().getName());
        row.put("risultato", match.getStatus() == MatchStatus.COMPLETED
                ? RoundFactsBuilder.describeResult(match)
                : "da giocare");
        return row;
    }

    private static Optional<Integer> parseInteger(Object value) {
        if (value instanceof Number number && number.doubleValue() == Math.rint(number.doubleValue())) {
            return Optional.of(number.intValue());
        }
        if (value instanceof String text) {
            try {
                return Optional.of(Integer.parseInt(text.strip()));
            } catch (NumberFormatException ex) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    private static Map<String, Object> error(String message) {
        return Map.of("error", message);
    }

    private static Map<String, Object> objectSchema(Map<String, Object> properties, List<String> required) {
        return Map.of("type", "object", "properties", properties, "required", required);
    }
}
