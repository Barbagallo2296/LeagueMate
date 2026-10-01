package com.leaguemate.api.ai.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OpenAiCompatibleClient implements AiClient {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final RestClient restClient;
    private final AiProperties properties;
    private final JsonMapper jsonMapper;

    public OpenAiCompatibleClient(RestClient.Builder builder, AiProperties properties, JsonMapper jsonMapper) {
        if (properties.hasApiKey()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey());
        }
        this.restClient = builder.baseUrl(properties.normalizedBaseUrl()).build();
        this.properties = properties;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public AiResponse chat(List<ChatMessage> messages, List<ToolDefinition> tools, int maxTokens) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("messages", messages.stream().map(this::toOpenAiMessage).toList());
        body.put("temperature", properties.temperature());
        body.put("max_tokens", maxTokens);
        if (!tools.isEmpty()) {
            body.put("tools", tools.stream().map(OpenAiCompatibleClient::toOpenAiTool).toList());
        }

        ChatCompletion response;
        try {
            response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(ChatCompletion.class);
        } catch (ResourceAccessException ex) {
            throw new AiException("AI service unreachable or timed out", ex);
        } catch (RestClientException ex) {
            throw new AiException("AI service error", ex);
        }

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new AiException("Empty response from the AI service");
        }

        CompletionMessage message = response.choices().getFirst().message();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<CompletionToolCall> rawCalls = message.toolCalls() != null ? message.toolCalls() : List.of();
        for (int i = 0; i < rawCalls.size(); i++) {
            CompletionToolCall call = rawCalls.get(i);
            String id = call.id() != null && !call.id().isBlank() ? call.id() : "call_" + i;
            toolCalls.add(new ToolCall(id, call.function().name(), parseArguments(call.function().arguments())));
        }
        return new AiResponse(message.content(), toolCalls, response.model());
    }

    @Override
    public String model() {
        return properties.model();
    }

    private Map<String, Object> parseArguments(String arguments) {
        if (arguments == null || arguments.isBlank()) {
            return Map.of();
        }
        try {
            return jsonMapper.readValue(arguments, MAP_TYPE);
        } catch (JacksonException ex) {
            return Map.of();
        }
    }

    private Map<String, Object> toOpenAiMessage(ChatMessage message) {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("role", message.role());
        json.put("content", message.content());
        if (!message.toolCalls().isEmpty()) {
            json.put("tool_calls", message.toolCalls().stream()
                    .map(call -> Map.of(
                            "id", call.id(),
                            "type", "function",
                            "function", Map.of(
                                    "name", call.name(),
                                    "arguments", jsonMapper.writeValueAsString(call.arguments()))))
                    .toList());
        }
        if (message.toolCallId() != null) {
            json.put("tool_call_id", message.toolCallId());
        }
        return json;
    }

    private static Map<String, Object> toOpenAiTool(ToolDefinition tool) {
        return Map.of("type", "function", "function", Map.of(
                "name", tool.name(),
                "description", tool.description(),
                "parameters", tool.parameters()));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatCompletion(String model, List<Choice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(CompletionMessage message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CompletionMessage(String content, @JsonProperty("tool_calls") List<CompletionToolCall> toolCalls) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CompletionToolCall(String id, CompletionFunction function) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CompletionFunction(String name, String arguments) {
    }
}
