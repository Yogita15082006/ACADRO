package com.acronexus.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configures the RestTemplate used to communicate with the
 * external ai-services (FastAPI) module.
 *
 * The backend no longer communicates with Groq directly.
 */
@Configuration
public class AiConfig {

    @Bean
    public RestTemplate aiServiceRestTemplate(RestTemplateBuilder builder, AiServiceProperties properties) {
        return builder
                .setConnectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                .build();
    }
}
