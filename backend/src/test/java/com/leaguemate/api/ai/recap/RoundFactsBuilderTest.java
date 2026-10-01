package com.leaguemate.api.ai.recap;

import com.leaguemate.api.dto.StandingEntry;
import com.leaguemate.api.entity.Match;
import com.leaguemate.api.entity.MatchStatus;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.entity.Team;
import com.leaguemate.api.entity.Tournament;
import com.leaguemate.api.exception.ResourceNotFoundException;
import com.leaguemate.api.service.TournamentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoundFactsBuilder - fatti della giornata scritti in italiano")
class RoundFactsBuilderTest {

    @Mock
    private TournamentService tournamentService;

    @InjectMocks
    private RoundFactsBuilder builder;

    private final Team marineFord = team(1, "Marine Ford");
    private final Team blackbeard = team(2, "Blackbeard City");
    private final Team redHair = team(3, "Red Hair United");
    private final Team whitebeard = team(4, "Whitebeard Rovers");
    private final Team heart = team(5, "Heart Pirates");
    private final Team kid = team(6, "Kid Pirates");

    @Test
    @DisplayName("Formato completo: risultati, classifica, da segnalare e prossima giornata")
    void build_FullFormat() {
        given(List.of(
                        round(1, played(marineFord, heart, 2, 0)),
                        round(2,
                                played(marineFord, blackbeard, 2, 0),
                                played(redHair, whitebeard, 3, 3),
                                played(heart, kid, 3, 2)),
                        round(3,
                                scheduled(whitebeard, marineFord),
                                scheduled(kid, blackbeard))),
                List.of(marineFord, blackbeard, redHair, whitebeard, heart, kid),
                2,
                List.of(
                        standing("Marine Ford", 6, 2, 0, 0, 5, 0),
                        standing("Heart Pirates", 3, 1, 0, 1, 4, 5),
                        standing("Whitebeard Rovers", 1, 0, 1, 1, 3, 5)));

        String facts = builder.build(10L, 2);

        assertEquals("""
                Giornata 2 di 3 del torneo Grand Line Cup.

                RISULTATI:
                - Marine Ford batte Blackbeard City 2-0 (vittoria in casa)
                - Red Hair United e Whitebeard Rovers pareggiano 3-3
                - Heart Pirates batte Kid Pirates 3-2 (vittoria in casa)

                CLASSIFICA DOPO LA GIORNATA:
                1. Marine Ford 6 punti (2 vittorie, 0 pareggi, 0 sconfitte)
                2. Heart Pirates 3 punti (1 vittoria, 0 pareggi, 1 sconfitta)
                3. Whitebeard Rovers 1 punto (0 vittorie, 1 pareggio, 1 sconfitta)

                DA SEGNALARE:
                - Capolista: Marine Ford, 3 punti di vantaggio su Heart Pirates
                - Miglior attacco: Marine Ford (5 gol)
                - Peggior difesa: Heart Pirates e Whitebeard Rovers (5 gol subiti)
                - Ancora imbattute: Marine Ford
                - Ancora senza vittorie: Whitebeard Rovers
                - Mancano 2 partite alla fine

                PROSSIMA GIORNATA:
                - Whitebeard Rovers - Marine Ford
                - Kid Pirates - Blackbeard City""", facts);
    }

    @Test
    @DisplayName("Vittoria in trasferta: prima la squadra che vince, con il suo punteggio")
    void build_AwayWin_WinnerFirst() {
        given(List.of(round(1, played(kid, heart, 1, 4)), round(2, scheduled(heart, kid))),
                List.of(kid, heart), 1,
                List.of(standing("Heart Pirates", 3, 1, 0, 0, 4, 1), standing("Kid Pirates", 0, 0, 0, 1, 1, 4)));

        String facts = builder.build(10L, 1);

        assertTrue(facts.contains("- Heart Pirates batte Kid Pirates 4-1 (vittoria in trasferta)"));
    }

    @Test
    @DisplayName("Singolari: 1 punto di vantaggio, manca 1 partita")
    void build_SingularForms() {
        given(List.of(round(1, played(heart, kid, 1, 1)), round(2, scheduled(kid, heart))),
                List.of(heart, kid), 1,
                List.of(standing("Heart Pirates", 1, 0, 1, 0, 1, 1), standing("Kid Pirates", 0, 0, 0, 1, 1, 1)));

        String facts = builder.build(10L, 1);

        assertTrue(facts.contains("- Capolista: Heart Pirates, 1 punto di vantaggio su Kid Pirates"));
        assertTrue(facts.contains("- Manca 1 partita alla fine"));
    }

    @Test
    @DisplayName("Righe facoltative omesse se nessuna squadra è imbattuta o senza vittorie")
    void build_OptionalLinesOmitted() {
        given(List.of(round(1, played(heart, kid, 2, 1)), round(2, played(kid, heart, 3, 0))),
                List.of(heart, kid), 2,
                List.of(standing("Kid Pirates", 3, 1, 0, 1, 4, 2), standing("Heart Pirates", 3, 1, 0, 1, 2, 4)));

        String facts = builder.build(10L, 2);

        assertFalse(facts.contains("imbattute"));
        assertFalse(facts.contains("senza vittorie"));
    }

    @Test
    @DisplayName("Ultima giornata: niente prossima giornata, segnalata la fine del torneo")
    void build_LastRound() {
        given(List.of(round(1, played(heart, kid, 2, 0))),
                List.of(heart, kid), 1,
                List.of(standing("Heart Pirates", 3, 1, 0, 0, 2, 0), standing("Kid Pirates", 0, 0, 0, 1, 0, 2)));

        String facts = builder.build(10L, 1);

        assertTrue(facts.contains("- Era l'ultima giornata del torneo"));
        assertFalse(facts.contains("PROSSIMA GIORNATA"));
    }

    @Test
    @DisplayName("Parità in testa e squadra che riposa")
    void build_TiedLeadersAndRestingTeam() {
        given(List.of(round(1, played(heart, kid, 1, 0)), round(2, played(kid, redHair, 2, 0))),
                List.of(heart, kid, redHair), 2,
                List.of(
                        standing("Heart Pirates", 3, 1, 0, 0, 1, 0),
                        standing("Kid Pirates", 3, 1, 0, 1, 2, 1),
                        standing("Red Hair United", 0, 0, 0, 1, 0, 2)));

        String facts = builder.build(10L, 2);

        assertTrue(facts.contains("- Riposa: Heart Pirates"));
        assertTrue(facts.contains("- Capolista a pari punti: Heart Pirates e Kid Pirates (3 punti)"));
    }

    @Test
    @DisplayName("Giornata inesistente → ResourceNotFoundException")
    void build_RoundNotFound_Throws() {
        when(tournamentService.getTournamentById(10L)).thenReturn(tournament());
        when(tournamentService.getRounds(10L)).thenReturn(List.of(round(1, played(heart, kid, 1, 0))));

        assertThrows(ResourceNotFoundException.class, () -> builder.build(10L, 5));
    }

    private void given(List<Round> rounds, List<Team> teams, int roundNumber, List<StandingEntry> standings) {
        when(tournamentService.getTournamentById(10L)).thenReturn(tournament());
        when(tournamentService.getRounds(10L)).thenReturn(rounds);
        when(tournamentService.getRegisteredTeams(10L)).thenReturn(teams);
        when(tournamentService.calculateStandingsUpToRound(10L, roundNumber)).thenReturn(standings);
    }

    private static Tournament tournament() {
        Tournament tournament = new Tournament();
        tournament.setId(10L);
        tournament.setName("Grand Line Cup");
        return tournament;
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

    private static StandingEntry standing(String name, int points, int wins, int draws, int losses,
                                          int goalsFor, int goalsAgainst) {
        return new StandingEntry(name, points, wins, draws, losses, goalsFor, goalsAgainst, goalsFor - goalsAgainst);
    }
}
