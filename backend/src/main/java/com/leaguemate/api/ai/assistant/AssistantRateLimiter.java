package com.leaguemate.api.ai.assistant;

import com.leaguemate.api.exception.TooManyRequestsException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class AssistantRateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final long capacity;
    private final Duration period;

    public AssistantRateLimiter(@Value("${app.ai.assistant.rate-limit.capacity:10}") long capacity,
                                @Value("${app.ai.assistant.rate-limit.period:1m}") Duration period) {
        this.capacity = capacity;
        this.period = period;
    }

    public void check(String username) {
        Bucket bucket = buckets.computeIfAbsent(username, key -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (!probe.isConsumed()) {
            long retryAfterSeconds = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
            throw new TooManyRequestsException(
                    "Too many questions to the assistant. Retry in " + retryAfterSeconds + " seconds",
                    retryAfterSeconds);
        }
    }

    @Scheduled(fixedDelayString = "${app.ai.assistant.rate-limit.cleanup-interval:10m}")
    public int evictIdleBuckets() {
        int before = buckets.size();
        buckets.values().removeIf(bucket -> bucket.getAvailableTokens() >= capacity);
        return before - buckets.size();
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(capacity, period).build())
                .build();
    }
}
