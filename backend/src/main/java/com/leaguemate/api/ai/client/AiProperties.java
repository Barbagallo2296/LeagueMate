package com.leaguemate.api.ai.client;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(
        boolean enabled,
        String provider,
        String baseUrl,
        String model,
        String apiKey,
        Duration connectTimeout,
        Duration readTimeout,
        double temperature,
        int contextSize
) {

    public String normalizedBaseUrl() {
        String url = baseUrl == null ? "" : baseUrl.strip();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    public boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}
