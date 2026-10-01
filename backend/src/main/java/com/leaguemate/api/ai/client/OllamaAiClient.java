package com.leaguemate.api.ai.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OllamaAiClient implements AiClient {

    private final RestClient restClient;
    private final AiProperties properties;

    public OllamaAiClient(RestClient.Builder builder, AiProperties properties) {
        this.restClient = builder.baseUrl(properties.baseUrl()).build();
        this.properties = properties;
    }

    @Override
    public AiResponse chat(List<ChatMessage> messages, List<ToolDefinition> tools, int maxTokens) {
        try {
            return send(buildBody(messages, tools, maxTokens, true));
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is4xxClientError() && ex.getResponseBodyAsString().contains("think")) {
                try {
                    return send(buildBody(messages, tools, maxTokens, false));
                } catch (RestClientException retryEx) {
                    throw translate(retryEx);
                }
            }
            throw translate(ex);
        } catch (RestClientException ex) {
            throw translate(ex);
        }
    }

    @Override
    public String model() {
        return properties.model();
    }

    private AiResponse send(Map<String, Object> body) {
        OllamaResponse response = restClient.post()
                .uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(OllamaResponse.class);

        if (response == null || response.message() == null) {
            throw new AiException("Empty response from the AI service");
        }

        List<ToolCall> toolCalls = new ArrayList<>();
        List<OllamaToolCall> rawCalls = response.message().toolCalls();
        if (rawCalls != null) {
            for (int i = 0; i < rawCalls.size(); i++) {
                OllamaFunction function = rawCalls.get(i).function();
                Map<String, Object> arguments = function.arguments() != null ? function.arguments() : Map.of();
                toolCalls.add(new ToolCall("call_" + i, function.name(), arguments));
            }
        }
        return new AiResponse(response.message().content(), toolCalls, response.model());
    }

    private Map<String, Object> buildBody(List<ChatMessage> messages, List<ToolDefinition> tools,
                                          int maxTokens, boolean disableThinking) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("messages", messages.stream().map(OllamaAiClient::toOllamaMessage).toList());
        body.put("stream", false);
        if (disableThinking) {
            body.put("think", false);
        }
        if (!tools.isEmpty()) {
            body.put("tools", tools.stream().map(OllamaAiClient::toOllamaTool).toList());
        }
        body.put("options", Map.of(
                "num_ctx", properties.contextSize(),
                "temperature", properties.temperature(),
                "num_predict", maxTokens));
        return body;
    }

    private static Map<String, Object> toOllamaMessage(ChatMessage message) {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("role", message.role());
        json.put("content", message.content() != null ? message.content() : "");
        if (!message.toolCalls().isEmpty()) {
            json.put("tool_calls", message.toolCalls().stream()
                    .map(call -> Map.of("function", Map.of("name", call.name(), "arguments", call.arguments())))
                    .toList());
        }
        if (message.toolName() != null) {
            json.put("tool_name", message.toolName());
        }
        return json;
    }

    private static Map<String, Object> toOllamaTool(ToolDefinition tool) {
        return Map.of("type", "function", "function", Map.of(
                "name", tool.name(),
                "description", tool.description(),
                "parameters", tool.parameters()));
    }

    private static AiException translate(RestClientException ex) {
        if (ex instanceof ResourceAccessException) {
            return new AiException("AI service unreachable or timed out", ex);
        }
        if (ex instanceof RestClientResponseException response && response.getStatusCode().value() == 404) {
            return new AiException("AI model not available yet (it may still be downloading)", ex);
        }
        return new AiException("AI service error", ex);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OllamaResponse(String model, OllamaMessage message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OllamaMessage(String content, @JsonProperty("tool_calls") List<OllamaToolCall> toolCalls) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OllamaToolCall(OllamaFunction function) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OllamaFunction(String name, Map<String, Object> arguments) {
    }
}
