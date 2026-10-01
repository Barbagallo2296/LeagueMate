package com.leaguemate.api.ai.assistant;

import com.leaguemate.api.ai.client.AiClient;
import com.leaguemate.api.ai.client.AiException;
import com.leaguemate.api.ai.client.AiResponse;
import com.leaguemate.api.ai.client.ChatMessage;
import com.leaguemate.api.ai.client.ToolCall;
import com.leaguemate.api.ai.client.ToolDefinition;
import com.leaguemate.api.ai.recap.RoundRecapService;
import com.leaguemate.api.dto.AssistantResponse;
import com.leaguemate.api.entity.MatchStatus;
import com.leaguemate.api.entity.Round;
import com.leaguemate.api.entity.Team;
import com.leaguemate.api.entity.Tournament;
import com.leaguemate.api.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TournamentAssistantService {

    static final String SYSTEM_PROMPT = "Sei l'assistente del torneo %s su LeagueMate. Rispondi in italiano, "
            + "in modo breve (massimo 3 frasi). Per qualsiasi informazione sul torneo chiama i tool: rispondi SOLO "
            + "con i dati che ti restituiscono, senza inventare né ricalcolare. Squadre: %s. "
            + "Le giornate giocate sono %d su %d.";

    static final int MAX_STEPS = 4;
    static final int MAX_TOKENS = 300;
    static final String UNAVAILABLE_MESSAGE = "The assistant is not available right now, please try again later";
    static final String DISABLED_MESSAGE = "AI features are disabled";

    private static final Logger log = LoggerFactory.getLogger(TournamentAssistantService.class);

    private final AiClient aiClient;
    private final TournamentService tournamentService;
    private final TournamentTools tools;

    public AssistantResponse ask(Long tournamentId, String question) {
        Tournament tournament = tournamentService.getTournamentById(tournamentId);
        if (!aiClient.enabled()) {
            return AssistantResponse.unavailable(DISABLED_MESSAGE);
        }

        List<String> teamNames = tournamentService.getRegisteredTeams(tournamentId).stream()
                .map(Team::getName)
                .toList();
        List<Round> rounds = tournamentService.getRounds(tournamentId);
        long playedRounds = rounds.stream().filter(TournamentAssistantService::isComplete).count();

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.system(SYSTEM_PROMPT.formatted(
                tournament.getName(), String.join(", ", teamNames), playedRounds, rounds.size())));
        messages.add(ChatMessage.user(question.strip()));
        List<ToolDefinition> definitions = tools.definitions(teamNames, rounds.size());
        List<String> toolsUsed = new ArrayList<>();

        try {
            for (int step = 0; step < MAX_STEPS; step++) {
                AiResponse response = aiClient.chat(List.copyOf(messages), definitions, MAX_TOKENS);
                if (!response.hasToolCalls()) {
                    return answer(response, toolsUsed);
                }
                messages.add(ChatMessage.assistant(response.content(), response.toolCalls()));
                for (ToolCall call : response.toolCalls()) {
                    if (!toolsUsed.contains(call.name())) {
                        toolsUsed.add(call.name());
                    }
                    messages.add(ChatMessage.toolResult(call, tools.execute(tournamentId, call)));
                }
            }
            return answer(aiClient.chat(List.copyOf(messages), List.of(), MAX_TOKENS), toolsUsed);
        } catch (AiException ex) {
            log.warn("Assistant unavailable for tournament {}: {}", tournamentId, ex.getMessage());
            return AssistantResponse.unavailable(UNAVAILABLE_MESSAGE);
        } catch (RuntimeException ex) {
            log.error("Unexpected assistant error for tournament {}", tournamentId, ex);
            return AssistantResponse.unavailable(UNAVAILABLE_MESSAGE);
        }
    }

    private static AssistantResponse answer(AiResponse response, List<String> toolsUsed) {
        if (response.content() == null || response.content().isBlank()) {
            return AssistantResponse.unavailable(UNAVAILABLE_MESSAGE);
        }
        return AssistantResponse.ok(RoundRecapService.removeMarkdown(response.content()), List.copyOf(toolsUsed));
    }

    private static boolean isComplete(Round round) {
        return !round.getMatches().isEmpty()
                && round.getMatches().stream().allMatch(match -> match.getStatus() == MatchStatus.COMPLETED);
    }
}
