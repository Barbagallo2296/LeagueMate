package com.leaguemate.api.ai.assistant;

import com.leaguemate.api.exception.TooManyRequestsException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AssistantRateLimiter - limite di domande per utente")
class AssistantRateLimiterTest {

    @Test
    @DisplayName("Oltre il limite → TooManyRequestsException con Retry-After")
    void check_OverLimit_Throws() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(2, Duration.ofMinutes(1));

        limiter.check("law_organizer");
        limiter.check("law_organizer");
        TooManyRequestsException ex = assertThrows(TooManyRequestsException.class,
                () -> limiter.check("law_organizer"));

        assertTrue(ex.getRetryAfterSeconds() >= 1);
    }

    @Test
    @DisplayName("Il limite è per utente: gli altri non vengono bloccati")
    void check_IsPerUser() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(1, Duration.ofMinutes(1));

        limiter.check("law_organizer");

        assertDoesNotThrow(() -> limiter.check("shanks_player"));
    }

    @Test
    @DisplayName("La pulizia elimina solo i contatori inattivi")
    void evictIdleBuckets_RemovesOnlyFullBuckets() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(5, Duration.ofMinutes(1));
        limiter.check("law_organizer");

        assertEquals(0, limiter.evictIdleBuckets());
    }
}
