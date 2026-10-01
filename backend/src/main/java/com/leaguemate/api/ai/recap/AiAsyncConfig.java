package com.leaguemate.api.ai.recap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AiAsyncConfig {

    public static final String AI_EXECUTOR = "aiExecutor";

    private static final Logger log = LoggerFactory.getLogger(AiAsyncConfig.class);

    @Bean(name = AI_EXECUTOR)
    public Executor aiExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("ai-");
        executor.setRejectedExecutionHandler((task, pool) ->
                log.warn("AI queue full: recap generation skipped"));
        executor.initialize();
        return executor;
    }
}
