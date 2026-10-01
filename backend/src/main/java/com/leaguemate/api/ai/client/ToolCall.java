package com.leaguemate.api.ai.client;

import java.util.Map;

public record ToolCall(String id, String name, Map<String, Object> arguments) {
}
