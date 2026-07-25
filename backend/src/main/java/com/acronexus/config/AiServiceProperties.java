package com.acronexus.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for connecting to the external ai-services module.
 * The backend no longer talks to Groq directly — it calls ai-services instead.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "ai.service")
public class AiServiceProperties {
    private String baseUrl = "http://localhost:8000";
    private int timeoutMs = 60000;


    public String getBaseUrl() {
        return this.baseUrl;
    }
    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getTimeoutMs() {
        return this.timeoutMs;
    }
    public void setTimeoutMs(int timeoutMs) {
        this.timeoutMs = timeoutMs;
    }
}
