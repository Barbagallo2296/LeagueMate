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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoundRecapService {

    static final String SYSTEM_PROMPT = "Sei il cronista sportivo di LeagueMate, piattaforma per tornei amatoriali "
            + "di calcio. Scrivi in italiano, tono vivace da quotidiano sportivo. Usa SOLO i fatti forniti, "
            + "riportando i risultati esattamente come sono scritti (chi batte chi e con che punteggio). "
            + "Non inventare marcatori, minuti, giocatori, capitani, record, episodi, date o momenti (oggi, domani). "
            + "Non ricalcolare nulla. Scrivi 2 paragrafi brevi, senza titolo. Non usare markdown. "
            + "Massimo 120 parole.";

    static final String USER_PROMPT_PREFIX = "Scrivi la cronaca usando solo questi fatti:\n\n";

    static final int MAX_TOKENS = 400;
    private static final int MAX_CONTENT_LENGTH = 2000;
    private static final int MAX_ERROR_LENGTH = 255;

    private static final Logger log = LoggerFactory.getLogger(RoundRecapService.class);

    private final AiClient aiClient;
    private final RoundFactsBuilder factsBuilder;
    private final AiRoundRecapRepository recapRepository;
    private final RoundRepository roundRepository;
    private final MatchRepository matchRepository;
    private final ApplicationEventPublisher eventPublisher;

    public RoundRecapResponse getRecap(Long tournamentId, int roundNumber) {
        Round round = findRound(tournamentId, roundNumber);
        return recapRepository.findByRoundId(round.getId())
                .map(recap -> new RoundRecapResponse(
                        recap.getStatus().name(), recap.getContent(), recap.getModel(), recap.getGeneratedAt()))
                .orElseGet(RoundRecapResponse::notAvailable);
    }

    public void requestRegeneration(Long tournamentId, int roundNumber) {
        if (!aiClient.enabled()) {
            throw new ResourceConflictException("AI features are disabled");
        }
        Round round = findRound(tournamentId, roundNumber);
        if (matchRepository.countByRoundIdAndStatus(round.getId(), MatchStatus.SCHEDULED) > 0) {
            throw new ResourceConflictException("Round " + roundNumber + " is not complete yet");
        }
        savePending(round.getId());
        eventPublisher.publishEvent(new RoundCompletedEvent(tournamentId, round.getId(), roundNumber));
    }

    public void generate(Long tournamentId, Long roundId, int roundNumber) {
        if (!aiClient.enabled()) {
            return;
        }

        AiRoundRecap recap = savePending(roundId);

        try {
            String facts = factsBuilder.build(tournamentId, roundNumber);
            AiResponse response = aiClient.chat(List.of(
                    ChatMessage.system(SYSTEM_PROMPT),
                    ChatMessage.user(USER_PROMPT_PREFIX + facts)), List.of(), MAX_TOKENS);

            if (response.content() == null || response.content().isBlank()) {
                throw new AiException("Empty response from the AI service");
            }

            recap.setStatus(RecapStatus.READY);
            recap.setContent(truncate(removeMarkdown(response.content()), MAX_CONTENT_LENGTH));
            recap.setModel(response.model() != null ? response.model() : aiClient.model());
            recap.setGeneratedAt(LocalDateTime.now());
        } catch (AiException ex) {
            log.warn("Recap generation failed for round {}: {}", roundId, ex.getMessage());
            recap.setStatus(RecapStatus.FAILED);
            recap.setErrorMessage(truncate(ex.getMessage(), MAX_ERROR_LENGTH));
        } catch (RuntimeException ex) {
            log.error("Unexpected error generating recap for round {}", roundId, ex);
            recap.setStatus(RecapStatus.FAILED);
            recap.setErrorMessage("Unexpected error while generating the recap");
        }
        recapRepository.save(recap);
    }

    private Round findRound(Long tournamentId, int roundNumber) {
        return roundRepository.findByTournamentIdAndRoundNumber(tournamentId, roundNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Round " + roundNumber + " not found in tournament with id: " + tournamentId));
    }

    private AiRoundRecap savePending(Long roundId) {
        AiRoundRecap recap = recapRepository.findByRoundId(roundId).orElseGet(() -> {
            AiRoundRecap created = new AiRoundRecap();
            created.setRound(roundRepository.getReferenceById(roundId));
            return created;
        });
        recap.setStatus(RecapStatus.PENDING);
        recap.setErrorMessage(null);
        return recapRepository.save(recap);
    }

    public static String removeMarkdown(String text) {
        return text.replace("**", "")
                .replace("__", "")
                .replaceAll("(?m)^\\s*#+\\s*", "")
                .strip();
    }

    private static String truncate(String text, int maxLength) {
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }
}
