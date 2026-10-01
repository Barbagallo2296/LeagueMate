package com.leaguemate.api.dto;

import java.util.List;

public record AssistantResponse(
        String status,
        String answer,
        List<String> toolsUsed,
        String message
) {

    public static AssistantResponse ok(String answer, List<String> toolsUsed) {
        return new AssistantResponse("OK", answer, toolsUsed, null);
    }

    public static AssistantResponse unavailable(String message) {
        return new AssistantResponse("UNAVAILABLE", null, List.of(), message);
    }
}
