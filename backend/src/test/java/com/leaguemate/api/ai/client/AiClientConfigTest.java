package com.leaguemate.api.ai.client;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AiClientConfig - scelta del provider")
class AiClientConfigTest {

    private final AiClientConfig config = new AiClientConfig();
    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    private static AiProperties properties(boolean enabled, String provider) {
        return new AiProperties(enabled, provider, "http://ollama:11434/", "qwen3.5:4b", "",
                Duration.ofSeconds(5), Duration.ofSeconds(180), 0.4, 4096);
    }

    @Test
    @DisplayName("ollama e openai (anche con maiuscole e spazi) → client corrispondente")
    void aiClient_KnownProviders() {
        assertInstanceOf(OllamaAiClient.class, config.aiClient(properties(true, "ollama"), jsonMapper));
        assertInstanceOf(OpenAiCompatibleClient.class, config.aiClient(properties(true, " OpenAI "), jsonMapper));
    }

    @Test
    @DisplayName("AI_ENABLED=false → client disattivato")
    void aiClient_Disabled() {
        AiClient client = config.aiClient(properties(false, "ollama"), jsonMapper);

        assertInstanceOf(DisabledAiClient.class, client);
        assertFalse(client.enabled());
    }

    @Test
    @DisplayName("Provider sconosciuto o vuoto → AI disattivata, il backend parte comunque")
    void aiClient_UnknownProvider_DisablesAi() {
        assertInstanceOf(DisabledAiClient.class, config.aiClient(properties(true, "olama"), jsonMapper));
        assertInstanceOf(DisabledAiClient.class, config.aiClient(properties(true, ""), jsonMapper));
        assertInstanceOf(DisabledAiClient.class, config.aiClient(properties(true, null), jsonMapper));
    }

    @Test
    @DisplayName("La barra finale dell'indirizzo viene tolta")
    void normalizedBaseUrl_RemovesTrailingSlash() {
        assertEquals("http://ollama:11434", properties(true, "ollama").normalizedBaseUrl());
    }
}
