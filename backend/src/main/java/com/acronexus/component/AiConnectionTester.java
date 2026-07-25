package com.acronexus.component;

import com.acronexus.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiConnectionTester implements CommandLineRunner {

    private final AiService aiService;

    @Override
    public void run(String... args) throws Exception {
        log.info("=================================================");
        log.info("Starting AI Infrastructure Health Check...");
        try {
            boolean isHealthy = aiService.checkHealth();
            if (isHealthy) {
                log.info(">>> AI Health Check PASSED: AI Service + Groq connection successful! <<<");
            } else {
                log.warn(">>> AI Health Check DEGRADED: AI Service is reachable but Groq API may be down. <<<");
            }
        } catch (Exception e) {
            log.error(">>> AI Health Check FAILED: Cannot reach AI Service - {} <<<", e.getMessage());
            log.error(">>> Make sure ai-services is running: cd ai-services && uvicorn app.main:app --reload <<<");
        }
        log.info("=================================================");
    }
}
