package com.leaguemate.api.dto;

import java.time.LocalDateTime;

public record RoundRecapResponse(
        String status,
        String content,
        String model,
        LocalDateTime generatedAt
) {

    public static final String NOT_AVAILABLE = "NOT_AVAILABLE";

    public static RoundRecapResponse notAvailable() {
        return new RoundRecapResponse(NOT_AVAILABLE, null, null, null);
    }
}
