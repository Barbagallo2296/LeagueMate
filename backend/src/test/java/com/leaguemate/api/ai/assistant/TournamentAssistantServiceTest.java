package com.leaguemate.api.ai.assistant;

import com.leaguemate.api.ai.client.AiClient;
import com.leaguemate.api.ai.client.AiException;
import com.leaguemate.api.ai.client.AiResponse;
import com.leaguemate.api.ai.client.ChatMessage;
import com.leaguemate.api.ai.client.ToolCall;
import com.leaguemate.api.ai.client.ToolDefinition;
import com.leaguemate.api.dto.AssistantResponse;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TournamentAssistantService - ciclo agentico con tool")
class TournamentAssistantServiceTest {

    private static final List<ToolDefinition> DEFINITIONS =
            List.of(new ToolDefinition("get_standings", "classifica", Map.of("type", "object")));

    @Mock
    private AiClient aiClient;

    @Mock
    private TournamentService tournamentService;

    @Mock
    private TournamentTools tools;

    @InjectMocks
    private TournamentAssistantService assistant;

    private void givenTournament() {
        Tournament tournament = new Tournament();
        tournament.setId(2L);
        tournament.setName("New World League");
        Team heart = team("Heart Pirates");
        Team kid = team("Kid Pirates");

        when(tournamentService.getTournamentById(2L)).thenReturn(tournament);
        when(aiClient.enabled()).thenReturn(true);
        when(tournamentService.getRegisteredTeams(2L)).thenReturn(List.of(heart, kid));
        when(tournamentService.getRounds(2L)).thenReturn(List.of(
                round(match(heart, kid, MatchStatus.COMPLETED)),
                round(match(kid, heart, MatchStatus.SCHEDULED))));
        when(tools.definitions(List.of("Heart Pirates", "Kid Pirates"), 2)).thenReturn(DEFINITIONS);
    }

    @Test
    @DisplayName("Risposta diretta: system prompt compilato con torneo, squadre e giornate giocate")
    @SuppressWarnings("unchecked")
    void ask_DirectAnswer_CompilesSystemPrompt() {
        givenTournament();
        when(aiClient.chat(anyList(), eq(DEFINITIONS), eq(300)))
                .thenReturn(new AiResponse("Ciao, chiedimi del torneo.", List.of(), "m"));

        AssistantResponse response = assistant.ask(2L, "  ciao  ");

        assertEquals("OK", response.status());
        assertEquals("Ciao, chiedimi del torneo.", response.answer());
        assertTrue(response.toolsUsed().isEmpty());

        ArgumentCaptor<List<ChatMessage>> messages = ArgumentCaptor.forClass(List.class);
        verify(aiClient).chat(messages.capture(), eq(DEFINITIONS), eq(300));
        assertEquals("Sei l'assistente del torneo New World League su LeagueMate. Rispondi in italiano, "
                        + "in modo breve (massimo 3 frasi). Per qualsiasi informazione sul torneo chiama i tool: "
                        + "rispondi SOLO con i dati che ti restituiscono, senza inventare né ricalcolare. "
                        + "Squadre: Heart Pirates, Kid Pirates. Le giornate giocate sono 1 su 2.",
                messages.getValue().get(0).content());
        assertEquals("ciao", messages.getValue().get(1).content());
    }

    @Test
    @DisplayName("Il modello chiede un tool: il backend lo esegue e rimanda il risultato")
    @SuppressWarnings("unchecked")
    void ask_WithToolCall_ExecutesToolAndAnswers() {
        givenTournament();
        ToolCall call = new ToolCall("call_0", "get_standings", Map.of());
        when(aiClient.chat(anyList(), eq(DEFINITIONS), eq(300)))
                .thenReturn(new AiResponse("", List.of(call), "m"))
                .thenReturn(new AiResponse("Primo è **Heart Pirates** con 3 punti.", List.of(), "m"));
        when(tools.execute(2L, call)).thenReturn("[{\"posizione\":1,\"squadra\":\"Heart Pirates\",\"punti\":3}]");

        AssistantResponse response = assistant.ask(2L, "chi è primo?");

        assertEquals("Primo è Heart Pirates con 3 punti.", response.answer());
        assertEquals(List.of("get_standings"), response.toolsUsed());

        ArgumentCaptor<List<ChatMessage>> messages = ArgumentCaptor.forClass(List.class);
        verify(aiClient, times(2)).chat(messages.capture(), eq(DEFINITIONS), eq(300));
        List<ChatMessage> second = messages.getAllValues().get(1);
        assertEquals(4, second.size());
        assertEquals("assistant", second.get(2).role());
        assertEquals("tool", second.get(3).role());
        assertEquals("get_standings", second.get(3).toolName());
    }

    @Test
    @DisplayName("Dopo 4 passaggi con tool, un'ultima chiamata senza tool forza la risposta")
    void ask_TooManyToolCalls_ForcesFinalAnswer() {
        givenTournament();
        ToolCall call = new ToolCall("call_0", "get_standings", Map.of());
        when(aiClient.chat(anyList(), eq(DEFINITIONS), eq(300))).thenReturn(new AiResponse("", List.of(call), "m"));
        when(aiClient.chat(anyList(), eq(List.of()), eq(300))).thenReturn(new AiResponse("Risposta.", List.of(), "m"));
        when(tools.execute(2L, call)).thenReturn("[]");

        AssistantResponse response = assistant.ask(2L, "?");

        assertEquals("Risposta.", response.answer());
        verify(aiClient, times(4)).chat(anyList(), eq(DEFINITIONS), eq(300));
        verify(aiClient, times(1)).chat(anyList(), eq(List.of()), eq(300));
        assertEquals(List.of("get_standings"), response.toolsUsed());
    }

    @Test
    @DisplayName("Ollama irraggiungibile → UNAVAILABLE, nessuna eccezione")
    void ask_AiUnavailable_ReturnsUnavailable() {
        givenTournament();
        when(aiClient.chat(anyList(), anyList(), anyInt())).thenThrow(new AiException("AI service unreachable"));

        AssistantResponse response = assertDoesNotThrow(() -> assistant.ask(2L, "chi è primo?"));

        assertEquals("UNAVAILABLE", response.status());
        assertNull(response.answer());
        assertNotNull(response.message());
    }

    @Test
    @DisplayName("Risposta vuota del modello → UNAVAILABLE")
    void ask_BlankAnswer_ReturnsUnavailable() {
        givenTournament();
        when(aiClient.chat(anyList(), anyList(), anyInt())).thenReturn(new AiResponse("  ", List.of(), "m"));

        assertEquals("UNAVAILABLE", assistant.ask(2L, "?").status());
    }

    @Test
    @DisplayName("AI disattivata → UNAVAILABLE senza chiamare il modello")
    void ask_AiDisabled_ReturnsUnavailable() {
        Tournament tournament = new Tournament();
        when(tournamentService.getTournamentById(2L)).thenReturn(tournament);
        when(aiClient.enabled()).thenReturn(false);

        AssistantResponse response = assistant.ask(2L, "?");

        assertEquals("UNAVAILABLE", response.status());
        assertEquals("AI features are disabled", response.message());
        verify(aiClient, never()).chat(anyList(), anyList(), anyInt());
    }

    @Test
    @DisplayName("Torneo inesistente → ResourceNotFoundException prima di chiamare il modello")
    void ask_UnknownTournament_Throws() {
        when(tournamentService.getTournamentById(99L)).thenThrow(new ResourceNotFoundException("not found"));

        assertThrows(ResourceNotFoundException.class, () -> assistant.ask(99L, "?"));
        verifyNoInteractions(aiClient);
    }

    private static Team team(String name) {
        Team team = new Team();
        team.setName(name);
        return team;
    }

    private static Round round(Match... matches) {
        Round round = new Round();
        round.setMatches(new ArrayList<>(List.of(matches)));
        return round;
    }

    private static Match match(Team home, Team away, MatchStatus status) {
        Match match = new Match();
        match.setHomeTeam(home);
        match.setAwayTeam(away);
        match.setStatus(status);
        return match;
    }
}
