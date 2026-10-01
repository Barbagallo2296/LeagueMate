package com.leaguemate.api.ai.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import java.net.http.HttpClient;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiClientConfig {

    private static final Logger log = LoggerFactory.getLogger(AiClientConfig.class);

    @Bean
    public AiClient aiClient(AiProperties properties, JsonMapper jsonMapper) {
        if (!properties.enabled()) {
            log.info("AI features disabled (AI_ENABLED=false)");
            return new DisabledAiClient();
        }

        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.connectTimeout())
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());
        RestClient.Builder builder = RestClient.builder().requestFactory(requestFactory);

        log.info("AI provider: {} at {}, model {}", properties.provider(), properties.baseUrl(), properties.model());
        return switch (properties.provider().toLowerCase()) {
            case "ollama" -> new OllamaAiClient(builder, properties);
            case "openai" -> new OpenAiCompatibleClient(builder, properties, jsonMapper);
            default -> throw new IllegalStateException(
                    "Unknown AI_PROVIDER '" + properties.provider() + "': use 'ollama' or 'openai'");
        };
    }
}
