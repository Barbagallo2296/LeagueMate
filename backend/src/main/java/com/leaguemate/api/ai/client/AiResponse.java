package com.leaguemate.api.ai.client;

import java.util.List;

public record AiResponse(String content, List<ToolCall> toolCalls, String model) {

    public boolean hasToolCalls() {
        return toolCalls != null && !toolCalls.isEmpty();
    }
}
