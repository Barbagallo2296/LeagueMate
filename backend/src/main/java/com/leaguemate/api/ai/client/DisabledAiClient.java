package com.leaguemate.api.ai.client;

import java.util.List;

public class DisabledAiClient implements AiClient {

    @Override
    public AiResponse chat(List<ChatMessage> messages, List<ToolDefinition> tools, int maxTokens) {
        throw new AiException("AI features are disabled");
    }

    @Override
    public String model() {
        return null;
    }

    @Override
    public boolean enabled() {
        return false;
    }
}
