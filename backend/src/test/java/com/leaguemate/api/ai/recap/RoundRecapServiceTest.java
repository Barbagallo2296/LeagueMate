package com.leaguemate.api.ai.recap;

import com.leaguemate.api.ai.client.AiClient;
import com.leaguemate.api.ai.client.AiException;
import com.leaguemate.api.ai.client.AiResponse;
import com.leaguemate.api.ai.client.ChatMessage;
import com.leaguemate.api.dto.RoundRecapResponse;
import com.leaguemate.api.entity.AiRoundRecap;
import com.leaguemate.api.entity.MatchStatus;
import com.leaguemate.api.entity.RecapStatus;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.exception.ResourceConflictException;
import com.leaguemate.api.exception.ResourceNotFoundException;
import com.leaguemate.api.repository.AiRoundRecapRepository;
import com.leaguemate.api.repository.MatchRepository;
import com.leaguemate.api.repository.RoundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoundRecapService - generazione della cronaca")
class RoundRecapServiceTest {

    private static final String FACTS = "Giornata 4 di 7 del torneo New World League.";

    @Mock
    private AiClient aiClient;

    @Mock
    private RoundFactsBuilder factsBuilder;

    @Mock
    private AiRoundRecapRepository recapRepository;

    @Mock
    private RoundRepository roundRepository;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private RoundRecapService recapService;

    private AiRoundRecap existing;

    @BeforeEach
    void setUp() {
        existing = new AiRoundRecap();
        existing.setId(1L);
        existing.setStatus(RecapStatus.FAILED);
        existing.setErrorMessage("old error");
    }

    private void givenExistingRecap() {
        when(aiClient.enabled()).thenReturn(true);
        when(recapRepository.findByRoundId(104L)).thenReturn(Optional.of(existing));
        when(recapRepository.save(any(AiRoundRecap.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Risposta del modello → READY con testo e modello, prompt corretti")
    @SuppressWarnings("unchecked")
    void generate_Success_SavesReady() {
        givenExistingRecap();
        when(factsBuilder.build(2L, 4)).thenReturn(FACTS);
        when(aiClient.chat(anyList(), anyList(), eq(400)))
                .thenReturn(new AiResponse("  Marine Ford vola!  ", List.of(), "qwen3.5:4b"));

        recapService.generate(2L, 104L, 4);

        assertEquals(RecapStatus.READY, existing.getStatus());
        assertEquals("Marine Ford vola!", existing.getContent());
        assertEquals("qwen3.5:4b", existing.getModel());
        assertNotNull(existing.getGeneratedAt());
        assertNull(existing.getErrorMessage());

        ArgumentCaptor<List<ChatMessage>> messages = ArgumentCaptor.forClass(List.class);
        verify(aiClient).chat(messages.capture(), eq(List.of()), eq(400));
        assertEquals(RoundRecapService.SYSTEM_PROMPT, messages.getValue().get(0).content());
        assertEquals("Scrivi la cronaca usando solo questi fatti:\n\n" + FACTS, messages.getValue().get(1).content());
    }

    @Test
    @DisplayName("Ollama irraggiungibile → FAILED con messaggio, nessuna eccezione")
    void generate_AiUnavailable_SavesFailed() {
        givenExistingRecap();
        when(factsBuilder.build(2L, 4)).thenReturn(FACTS);
        when(aiClient.chat(anyList(), anyList(), anyInt()))
                .thenThrow(new AiException("AI service unreachable or timed out"));

        assertDoesNotThrow(() -> recapService.generate(2L, 104L, 4));

        assertEquals(RecapStatus.FAILED, existing.getStatus());
        assertEquals("AI service unreachable or timed out", existing.getErrorMessage());
    }

    @Test
    @DisplayName("Risposta vuota → FAILED")
    void generate_EmptyResponse_SavesFailed() {
        givenExistingRecap();
        when(factsBuilder.build(2L, 4)).thenReturn(FACTS);
        when(aiClient.chat(anyList(), anyList(), anyInt())).thenReturn(new AiResponse(" ", List.of(), "m"));

        recapService.generate(2L, 104L, 4);

        assertEquals(RecapStatus.FAILED, existing.getStatus());
    }

    @Test
    @DisplayName("Errore inatteso → FAILED con messaggio generico")
    void generate_UnexpectedError_SavesFailed() {
        givenExistingRecap();
        when(factsBuilder.build(2L, 4)).thenThrow(new IllegalStateException("boom"));

        assertDoesNotThrow(() -> recapService.generate(2L, 104L, 4));

        assertEquals(RecapStatus.FAILED, existing.getStatus());
        assertEquals("Unexpected error while generating the recap", existing.getErrorMessage());
    }

    @Test
    @DisplayName("Prima cronaca della giornata → riga creata e salvata prima in PENDING")
    void generate_NoRecapYet_CreatesPendingThenReady() {
        Round round = new Round();
        round.setId(104L);
        when(aiClient.enabled()).thenReturn(true);
        when(recapRepository.findByRoundId(104L)).thenReturn(Optional.empty());
        when(roundRepository.getReferenceById(104L)).thenReturn(round);
        List<RecapStatus> savedStatuses = new ArrayList<>();
        when(recapRepository.save(any(AiRoundRecap.class))).thenAnswer(inv -> {
            AiRoundRecap recap = inv.getArgument(0);
            savedStatuses.add(recap.getStatus());
            return recap;
        });
        when(factsBuilder.build(2L, 4)).thenReturn(FACTS);
        when(aiClient.chat(anyList(), anyList(), anyInt())).thenReturn(new AiResponse("Testo", List.of(), null));
        when(aiClient.model()).thenReturn("qwen3.5:4b");

        recapService.generate(2L, 104L, 4);

        assertEquals(List.of(RecapStatus.PENDING, RecapStatus.READY), savedStatuses);
    }

    @Test
    @DisplayName("AI disattivata → nessuna riga creata, nessuna chiamata")
    void generate_AiDisabled_DoesNothing() {
        when(aiClient.enabled()).thenReturn(false);

        recapService.generate(2L, 104L, 4);

        verifyNoInteractions(recapRepository, factsBuilder);
        verify(aiClient, never()).chat(anyList(), anyList(), anyInt());
    }

    @Test
    @DisplayName("Lettura: cronaca esistente restituita con il suo stato")
    void getRecap_Existing_ReturnsIt() {
        LocalDateTime generatedAt = LocalDateTime.of(2026, 10, 1, 12, 0);
        existing.setStatus(RecapStatus.READY);
        existing.setContent("Testo");
        existing.setModel("qwen3.5:4b");
        existing.setGeneratedAt(generatedAt);
        when(roundRepository.findByTournamentIdAndRoundNumber(2L, 4)).thenReturn(Optional.of(round(104L)));
        when(recapRepository.findByRoundId(104L)).thenReturn(Optional.of(existing));

        RoundRecapResponse response = recapService.getRecap(2L, 4);

        assertEquals(new RoundRecapResponse("READY", "Testo", "qwen3.5:4b", generatedAt), response);
    }

    @Test
    @DisplayName("Lettura: nessuna cronaca → NOT_AVAILABLE")
    void getRecap_None_ReturnsNotAvailable() {
        when(roundRepository.findByTournamentIdAndRoundNumber(2L, 4)).thenReturn(Optional.of(round(104L)));
        when(recapRepository.findByRoundId(104L)).thenReturn(Optional.empty());

        assertEquals("NOT_AVAILABLE", recapService.getRecap(2L, 4).status());
    }

    @Test
    @DisplayName("Lettura: giornata inesistente → ResourceNotFoundException")
    void getRecap_UnknownRound_Throws() {
        when(roundRepository.findByTournamentIdAndRoundNumber(2L, 99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> recapService.getRecap(2L, 99));
    }

    @Test
    @DisplayName("Rigenerazione: giornata completa → PENDING e evento pubblicato")
    void requestRegeneration_CompleteRound_MarksPendingAndPublishes() {
        givenExistingRecap();
        when(roundRepository.findByTournamentIdAndRoundNumber(2L, 4)).thenReturn(Optional.of(round(104L)));
        when(matchRepository.countByRoundIdAndStatus(104L, MatchStatus.SCHEDULED)).thenReturn(0L);

        recapService.requestRegeneration(2L, 4);

        assertEquals(RecapStatus.PENDING, existing.getStatus());
        verify(eventPublisher).publishEvent(new RoundCompletedEvent(2L, 104L, 4));
    }

    @Test
    @DisplayName("Rigenerazione: giornata non completa → ResourceConflictException")
    void requestRegeneration_IncompleteRound_Throws() {
        when(aiClient.enabled()).thenReturn(true);
        when(roundRepository.findByTournamentIdAndRoundNumber(2L, 4)).thenReturn(Optional.of(round(104L)));
        when(matchRepository.countByRoundIdAndStatus(104L, MatchStatus.SCHEDULED)).thenReturn(1L);

        assertThrows(ResourceConflictException.class, () -> recapService.requestRegeneration(2L, 4));
        verifyNoInteractions(eventPublisher);
    }

    @Test
    @DisplayName("Rigenerazione: AI disattivata → ResourceConflictException")
    void requestRegeneration_AiDisabled_Throws() {
        when(aiClient.enabled()).thenReturn(false);

        assertThrows(ResourceConflictException.class, () -> recapService.requestRegeneration(2L, 4));
        verifyNoInteractions(eventPublisher, recapRepository);
    }

    private static Round round(Long id) {
        Round round = new Round();
        round.setId(id);
        return round;
    }
}
