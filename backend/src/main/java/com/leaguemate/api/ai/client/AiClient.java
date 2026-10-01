package com.leaguemate.api.ai.client;

import java.util.List;

public interface AiClient {

    AiResponse chat(List<ChatMessage> messages, List<ToolDefinition> tools, int maxTokens);

    String model();

    default boolean enabled() {
        return true;
    }
}
