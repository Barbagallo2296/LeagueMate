package com.leaguemate.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateMatchResultRequest(
        @NotNull(message = "Home score is required")
        @PositiveOrZero(message = "Score cannot be negative")
        @Max(value = 99, message = "Score cannot exceed 99")
        Integer homeScore,

        @NotNull(message = "Away score is required")
        @PositiveOrZero(message = "Score cannot be negative")
        @Max(value = 99, message = "Score cannot exceed 99")
        Integer awayScore
) {}