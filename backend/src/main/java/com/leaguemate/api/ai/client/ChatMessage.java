package com.leaguemate.api.ai.client;

import java.util.List;

public record ChatMessage(
        String role,
        String content,
        List<ToolCall> toolCalls,
        String toolCallId,
        String toolName
) {

    public static ChatMessage system(String content) {
        return new ChatMessage("system", content, List.of(), null, null);
    }

    public static ChatMessage user(String content) {
        return new ChatMessage("user", content, List.of(), null, null);
    }

    public static ChatMessage assistant(String content, List<ToolCall> toolCalls) {
        return new ChatMessage("assistant", content, toolCalls, null, null);
    }

    public static ChatMessage toolResult(ToolCall call, String resultJson) {
        return new ChatMessage("tool", resultJson, List.of(), call.id(), call.name());
    }
}
