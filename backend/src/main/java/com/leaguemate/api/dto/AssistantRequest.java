package com.leaguemate.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssistantRequest(
        @NotBlank(message = "Question is required")
        @Size(max = 300, message = "Question cannot exceed 300 characters")
        String question
) {}
