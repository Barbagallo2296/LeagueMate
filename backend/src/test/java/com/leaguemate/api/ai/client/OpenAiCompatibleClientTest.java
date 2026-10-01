package com.leaguemate.api.ai.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@DisplayName("OpenAiCompatibleClient - chiamate a servizi compatibili OpenAI")
class OpenAiCompatibleClientTest {

    private static final AiProperties PROPERTIES = new AiProperties(
            true, "openai", "https://openrouter.ai/api/v1", "qwen/qwen3.5-4b", "sk-test",
            Duration.ofSeconds(5), Duration.ofSeconds(60), 0.4, 4096);

    private MockRestServiceServer server;
    private OpenAiCompatibleClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new OpenAiCompatibleClient(builder, PROPERTIES, JsonMapper.builder().build());
    }

    @Test
    @DisplayName("Invia la chiave API e converte gli argomenti dei tool da stringa JSON")
    void chat_SendsBearerAndParsesToolCalls() {
        server.expect(requestTo("https://openrouter.ai/api/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer sk-test"))
                .andExpect(jsonPath("$.max_tokens").value(300))
                .andExpect(jsonPath("$.tools[0].type").value("function"))
                .andRespond(withSuccess("""
                        {"model":"qwen/qwen3.5-4b","choices":[{"message":{"content":null,
                         "tool_calls":[{"id":"abc","type":"function",
                           "function":{"name":"get_team_matches","arguments":"{\\"team_name\\":\\"Kid Pirates\\"}"}}]}}]}
                        """, MediaType.APPLICATION_JSON));

        ToolDefinition tool = new ToolDefinition("get_team_matches", "partite", Map.of("type", "object"));
        AiResponse response = client.chat(List.of(ChatMessage.user("Kid?")), List.of(tool), 300);

        ToolCall call = response.toolCalls().getFirst();
        assertEquals("abc", call.id());
        assertEquals("Kid Pirates", call.arguments().get("team_name"));
        server.verify();
    }

    @Test
    @DisplayName("Rimanda al modello il risultato del tool con il suo id")
    void chat_ToolResultMessage_IncludesToolCallId() {
        ToolCall call = new ToolCall("abc", "get_standings", Map.of());
        server.expect(jsonPath("$.messages[1].tool_calls[0].function.arguments").value("{}"))
                .andExpect(jsonPath("$.messages[2].role").value("tool"))
                .andExpect(jsonPath("$.messages[2].tool_call_id").value("abc"))
                .andRespond(withSuccess("""
                        {"model":"m","choices":[{"message":{"content":"Primo è Marine Ford."}}]}
                        """, MediaType.APPLICATION_JSON));

        AiResponse response = client.chat(List.of(
                ChatMessage.user("chi è primo?"),
                ChatMessage.assistant(null, List.of(call)),
                ChatMessage.toolResult(call, "[]")), List.of(), 300);

        assertEquals("Primo è Marine Ford.", response.content());
    }

    @Test
    @DisplayName("Argomenti non validi → mappa vuota, nessuna eccezione")
    void chat_InvalidArguments_ReturnsEmptyMap() {
        server.expect(requestTo("https://openrouter.ai/api/v1/chat/completions"))
                .andRespond(withSuccess("""
                        {"model":"m","choices":[{"message":{"tool_calls":[{"id":"x",
                         "function":{"name":"get_round","arguments":"non json"}}]}}]}
                        """, MediaType.APPLICATION_JSON));

        AiResponse response = client.chat(List.of(ChatMessage.user("?")), List.of(), 100);

        assertTrue(response.toolCalls().getFirst().arguments().isEmpty());
    }

    @Test
    @DisplayName("Errore del servizio → AiException")
    void chat_ServerError_ThrowsAiException() {
        server.expect(requestTo("https://openrouter.ai/api/v1/chat/completions"))
                .andRespond(withServerError());

        assertThrows(AiException.class, () -> client.chat(List.of(ChatMessage.user("?")), List.of(), 100));
    }
}
