package com.leaguemate.api.ai.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@DisplayName("OllamaAiClient - chiamate all'API nativa di Ollama")
class OllamaAiClientTest {

    private static final AiProperties PROPERTIES = new AiProperties(
            true, "ollama", "http://ollama:11434", "qwen3.5:4b", "",
            Duration.ofSeconds(5), Duration.ofSeconds(180), 0.4, 4096);

    private MockRestServiceServer server;
    private OllamaAiClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new OllamaAiClient(builder, PROPERTIES);
    }

    @Test
    @DisplayName("Invia modello, think=false e opzioni; restituisce il testo")
    void chat_SendsThinkFalseAndOptions_ReturnsContent() {
        server.expect(requestTo("http://ollama:11434/api/chat"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.model").value("qwen3.5:4b"))
                .andExpect(jsonPath("$.stream").value(false))
                .andExpect(jsonPath("$.think").value(false))
                .andExpect(jsonPath("$.options.num_ctx").value(4096))
                .andExpect(jsonPath("$.options.temperature").value(0.4))
                .andExpect(jsonPath("$.options.num_predict").value(400))
                .andExpect(jsonPath("$.messages", hasSize(2)))
                .andExpect(jsonPath("$.tools").doesNotExist())
                .andRespond(withSuccess("""
                        {"model":"qwen3.5:4b","message":{"role":"assistant","content":"Ciao!"},"done":true}
                        """, MediaType.APPLICATION_JSON));

        AiResponse response = client.chat(
                List.of(ChatMessage.system("sei un cronista"), ChatMessage.user("scrivi")), List.of(), 400);

        assertEquals("Ciao!", response.content());
        assertEquals("qwen3.5:4b", response.model());
        assertFalse(response.hasToolCalls());
        server.verify();
    }

    @Test
    @DisplayName("Converte le richieste di tool del modello")
    void chat_WithToolCalls_ParsesThem() {
        server.expect(requestTo("http://ollama:11434/api/chat"))
                .andExpect(jsonPath("$.tools[0].function.name").value("get_standings"))
                .andRespond(withSuccess("""
                        {"model":"qwen3.5:4b","message":{"role":"assistant","content":"",
                         "tool_calls":[{"function":{"name":"get_round","arguments":{"round_number":4}}}]}}
                        """, MediaType.APPLICATION_JSON));

        ToolDefinition tool = new ToolDefinition("get_standings", "classifica", Map.of("type", "object"));
        AiResponse response = client.chat(List.of(ChatMessage.user("chi è primo?")), List.of(tool), 300);

        assertTrue(response.hasToolCalls());
        ToolCall call = response.toolCalls().getFirst();
        assertEquals("get_round", call.name());
        assertEquals(4, call.arguments().get("round_number"));
    }

    @Test
    @DisplayName("Se il modello rifiuta il campo think, riprova senza")
    void chat_ThinkNotSupported_RetriesWithoutThink() {
        server.expect(jsonPath("$.think").value(false))
                .andRespond(withBadRequest().body("{\"error\":\"model does not support thinking\"}"));
        server.expect(jsonPath("$.think").doesNotExist())
                .andRespond(withSuccess("""
                        {"model":"qwen3.5:4b","message":{"content":"ok"}}
                        """, MediaType.APPLICATION_JSON));

        AiResponse response = client.chat(List.of(ChatMessage.user("ciao")), List.of(), 100);

        assertEquals("ok", response.content());
        server.verify();
    }

    @Test
    @DisplayName("Ollama irraggiungibile o lento → AiException")
    void chat_Timeout_ThrowsAiException() {
        server.expect(requestTo("http://ollama:11434/api/chat"))
                .andRespond(request -> {
                    throw new SocketTimeoutException("read timed out");
                });

        AiException ex = assertThrows(AiException.class,
                () -> client.chat(List.of(ChatMessage.user("ciao")), List.of(), 100));
        assertEquals("AI service unreachable or timed out", ex.getMessage());
    }

    @Test
    @DisplayName("Modello non ancora scaricato (404) → AiException con messaggio chiaro")
    void chat_ModelNotFound_ThrowsAiException() {
        server.expect(requestTo("http://ollama:11434/api/chat"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND).body("{\"error\":\"model 'qwen3.5:4b' not found\"}"));

        AiException ex = assertThrows(AiException.class,
                () -> client.chat(List.of(ChatMessage.user("ciao")), List.of(), 100));
        assertTrue(ex.getMessage().contains("not available"));
    }
}
