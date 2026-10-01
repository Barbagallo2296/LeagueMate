package com.leaguemate.api.ai.recap;

public record RoundCompletedEvent(Long tournamentId, Long roundId, int roundNumber) {
}
