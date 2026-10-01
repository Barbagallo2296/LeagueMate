package com.leaguemate.api.ai.recap;

import com.leaguemate.api.dto.StandingEntry;
import com.leaguemate.api.entity.Match;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.entity.Team;
import com.leaguemate.api.entity.Tournament;
import com.leaguemate.api.exception.ResourceNotFoundException;
import com.leaguemate.api.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.ToIntFunction;

@Component
@RequiredArgsConstructor
public class RoundFactsBuilder {

    private final TournamentService tournamentService;

    @Transactional(readOnly = true)
    public String build(Long tournamentId, int roundNumber) {
        Tournament tournament = tournamentService.getTournamentById(tournamentId);
        List<Round> rounds = tournamentService.getRounds(tournamentId);
        Round round = rounds.stream()
                .filter(r -> r.getRoundNumber() == roundNumber)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Round " + roundNumber + " not found in tournament " + tournamentId));

        StringBuilder facts = new StringBuilder();
        facts.append("Giornata ").append(roundNumber).append(" di ").append(rounds.size())
                .append(" del torneo ").append(tournament.getName()).append(".\n\n");

        appendResults(facts, round, tournamentService.getRegisteredTeams(tournamentId));
        List<StandingEntry> standings = tournamentService.calculateStandingsUpToRound(tournamentId, roundNumber);
        appendStandings(facts, standings);
        appendHighlights(facts, standings, rounds, roundNumber);
        appendNextRound(facts, rounds, roundNumber);

        return facts.toString().strip();
    }

    private void appendResults(StringBuilder facts, Round round, List<Team> registeredTeams) {
        facts.append("RISULTATI:\n");
        Set<Long> playing = new HashSet<>();
        for (Match match : round.getMatches()) {
            playing.add(match.getHomeTeam().getId());
            playing.add(match.getAwayTeam().getId());
            facts.append("- ").append(describeResult(match)).append('\n');
        }
        List<String> resting = registeredTeams.stream()
                .filter(team -> !playing.contains(team.getId()))
                .map(Team::getName)
                .toList();
        if (!resting.isEmpty()) {
            facts.append("- Riposa: ").append(joinNames(resting)).append('\n');
        }
        facts.append('\n');
    }

    public static String describeResult(Match match) {
        String home = match.getHomeTeam().getName();
        String away = match.getAwayTeam().getName();
        int homeScore = match.getHomeScore();
        int awayScore = match.getAwayScore();

        if (homeScore > awayScore) {
            return home + " batte " + away + " " + homeScore + "-" + awayScore + " (vittoria in casa)";
        }
        if (awayScore > homeScore) {
            return away + " batte " + home + " " + awayScore + "-" + homeScore + " (vittoria in trasferta)";
        }
        return home + " e " + away + " pareggiano " + homeScore + "-" + awayScore;
    }

    private void appendStandings(StringBuilder facts, List<StandingEntry> standings) {
        facts.append("CLASSIFICA DOPO LA GIORNATA:\n");
        for (int i = 0; i < standings.size(); i++) {
            StandingEntry entry = standings.get(i);
            facts.append(i + 1).append(". ").append(entry.teamName()).append(' ')
                    .append(count(entry.points(), "punto", "punti")).append(" (")
                    .append(count(entry.wins(), "vittoria", "vittorie")).append(", ")
                    .append(count(entry.draws(), "pareggio", "pareggi")).append(", ")
                    .append(count(entry.losses(), "sconfitta", "sconfitte")).append(")\n");
        }
        facts.append('\n');
    }

    private void appendHighlights(StringBuilder facts, List<StandingEntry> standings,
                                  List<Round> rounds, int roundNumber) {
        facts.append("DA SEGNALARE:\n");

        if (!standings.isEmpty()) {
            facts.append("- ").append(describeLeader(standings)).append('\n');
        }

        List<StandingEntry> bestAttack = leaders(standings, StandingEntry::goalsFor);
        if (!bestAttack.isEmpty()) {
            facts.append("- Miglior attacco: ").append(joinNames(names(bestAttack)))
                    .append(" (").append(bestAttack.getFirst().goalsFor()).append(" gol)\n");
        }

        List<StandingEntry> worstDefense = leaders(standings, StandingEntry::goalsAgainst);
        if (!worstDefense.isEmpty()) {
            facts.append("- Peggior difesa: ").append(joinNames(names(worstDefense)))
                    .append(" (").append(worstDefense.getFirst().goalsAgainst()).append(" gol subiti)\n");
        }

        List<String> unbeaten = standings.stream()
                .filter(entry -> played(entry) > 0 && entry.losses() == 0)
                .map(StandingEntry::teamName)
                .toList();
        if (!unbeaten.isEmpty()) {
            facts.append("- Ancora imbattute: ").append(joinNames(unbeaten)).append('\n');
        }

        List<String> winless = standings.stream()
                .filter(entry -> played(entry) > 0 && entry.wins() == 0)
                .map(StandingEntry::teamName)
                .toList();
        if (!winless.isEmpty()) {
            facts.append("- Ancora senza vittorie: ").append(joinNames(winless)).append('\n');
        }

        int remaining = rounds.stream()
                .filter(r -> r.getRoundNumber() > roundNumber)
                .mapToInt(r -> r.getMatches().size())
                .sum();
        if (remaining == 0) {
            facts.append("- Era l'ultima giornata del torneo\n");
        } else if (remaining == 1) {
            facts.append("- Manca 1 partita alla fine\n");
        } else {
            facts.append("- Mancano ").append(remaining).append(" partite alla fine\n");
        }
        facts.append('\n');
    }

    private String describeLeader(List<StandingEntry> standings) {
        StandingEntry first = standings.getFirst();
        List<StandingEntry> tied = standings.stream()
                .filter(entry -> entry.points() == first.points())
                .toList();

        if (tied.size() > 1) {
            return "Capolista a pari punti: " + joinNames(names(tied))
                    + " (" + count(first.points(), "punto", "punti") + ")";
        }
        if (standings.size() == 1) {
            return "Capolista: " + first.teamName();
        }
        StandingEntry second = standings.get(1);
        return "Capolista: " + first.teamName() + ", "
                + count(first.points() - second.points(), "punto", "punti")
                + " di vantaggio su " + second.teamName();
    }

    private void appendNextRound(StringBuilder facts, List<Round> rounds, int roundNumber) {
        rounds.stream()
                .filter(r -> r.getRoundNumber() == roundNumber + 1)
                .findFirst()
                .ifPresent(next -> {
                    facts.append("PROSSIMA GIORNATA:\n");
                    next.getMatches().forEach(match -> facts.append("- ")
                            .append(match.getHomeTeam().getName()).append(" - ")
                            .append(match.getAwayTeam().getName()).append('\n'));
                });
    }

    private static List<StandingEntry> leaders(List<StandingEntry> standings, ToIntFunction<StandingEntry> value) {
        int max = standings.stream().mapToInt(value).max().orElse(0);
        if (max == 0) {
            return List.of();
        }
        return standings.stream()
                .filter(entry -> value.applyAsInt(entry) == max)
                .sorted(Comparator.comparing(StandingEntry::teamName))
                .toList();
    }

    private static int played(StandingEntry entry) {
        return entry.wins() + entry.draws() + entry.losses();
    }

    private static List<String> names(List<StandingEntry> entries) {
        return entries.stream().map(StandingEntry::teamName).toList();
    }

    private static String count(int value, String singular, String plural) {
        return value + " " + (value == 1 ? singular : plural);
    }

    private static String joinNames(List<String> names) {
        if (names.size() == 1) {
            return names.getFirst();
        }
        return String.join(", ", names.subList(0, names.size() - 1)) + " e " + names.getLast();
    }
}
