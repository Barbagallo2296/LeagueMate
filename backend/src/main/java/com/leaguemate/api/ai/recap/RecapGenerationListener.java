package com.leaguemate.api.ai.recap;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class RecapGenerationListener {

    private final RoundRecapService recapService;

    @Async(AiAsyncConfig.AI_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onRoundCompleted(RoundCompletedEvent event) {
        recapService.generate(event.tournamentId(), event.roundId(), event.roundNumber());
    }
}
