package com.acronexus.service.impl;

import com.acronexus.config.AiServiceProperties;
import com.acronexus.dto.ai.AiGenericRequest;
import com.acronexus.dto.ai.AiGenericResponse;
import com.acronexus.exception.AiIntegrationException;
import com.acronexus.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * AI Service implementation that delegates ALL AI calls to the
 * external ai-services (FastAPI) module.
 *
 * This class does NOT communicate with Groq directly.
 * The ai-services module is the single owner of the Groq integration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroqAiServiceImpl implements AiService {

    private final RestTemplate aiServiceRestTemplate;
    private final AiServiceProperties aiServiceProperties;

    @Override
    public AiGenericResponse generateContent(AiGenericRequest request) {
        String url = aiServiceProperties.getBaseUrl() + "/generate";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AiGenericRequest> entity = new HttpEntity<>(request, headers);

        try {
            log.debug("Calling AI Service at {}", url);
            ResponseEntity<AiGenericResponse> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    AiGenericResponse.class
            );

            if (response.getBody() == null || response.getBody().getContent() == null) {
                throw new AiIntegrationException("AI Service returned empty response");
            }

            log.debug("AI Service responded successfully (tokens={})", response.getBody().getTotalTokensUsed());
            return response.getBody();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("AI Service returned HTTP {}: {}", e.getStatusCode(), errorBody);
            throw new AiIntegrationException("AI Service returned HTTP " + e.getStatusCode() + ": " + errorBody, e);
        } catch (RestClientException e) {
            log.error("Failed to communicate with AI Service: {}", e.getMessage(), e);
            throw new AiIntegrationException("Failed to communicate with AI Service: " + e.getMessage(), e);
        }
    }


    @Override
    public String extractTimetable(String fileUrl) {
        String url = aiServiceProperties.getBaseUrl() + "/extract";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("fileUrl", fileUrl);

        HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            log.debug("Calling AI Service Extract endpoint at {}", url);
            ResponseEntity<String> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getBody() == null) {
                throw new AiIntegrationException("AI Service Extract endpoint returned empty response");
            }

            return response.getBody();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorMsg = "AI Service Error";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("detail")) {
                    errorMsg = root.get("detail").asText();
                }
            } catch (Exception ex) {
                errorMsg = e.getResponseBodyAsString();
            }
            log.error("AI Service returned HTTP {}: {}", e.getStatusCode(), errorMsg);
            throw new IllegalArgumentException(errorMsg);
        } catch (RestClientException e) {
            log.error("Failed to communicate with AI Service Extract endpoint: {}", e.getMessage(), e);
            throw new AiIntegrationException("Failed to communicate with AI Service Extract endpoint: " + e.getMessage(), e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public java.util.Map<String, Object> parseSyllabus(String fileUrl) {
        String url = aiServiceProperties.getBaseUrl() + "/parse-syllabus";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("fileUrl", fileUrl);

        HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            log.debug("Calling AI Service Parse Syllabus endpoint at {}", url);
            ResponseEntity<java.util.Map> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    java.util.Map.class
            );

            if (response.getBody() == null) {
                throw new AiIntegrationException("AI Service Parse Syllabus endpoint returned empty response");
            }

            return (java.util.Map<String, Object>) response.getBody();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorMsg = "AI Service Error";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("detail")) {
                    errorMsg = root.get("detail").asText();
                }
            } catch (Exception ex) {
                errorMsg = e.getResponseBodyAsString();
            }
            log.error("AI Service returned HTTP {}: {}", e.getStatusCode(), errorMsg);
            throw new AiIntegrationException("AI Service returned HTTP " + e.getStatusCode() + ": " + errorMsg, e);
        } catch (RestClientException e) {
            log.error("Failed to communicate with AI Service Parse Syllabus endpoint: {}", e.getMessage(), e);
            throw new AiIntegrationException("Failed to communicate with AI Service Parse Syllabus endpoint: " + e.getMessage(), e);
        }
    }

    @Override
    public <T, R> R validateData(T request, Class<R> responseType) {
        String url = aiServiceProperties.getBaseUrl() + "/validate";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<T> entity = new HttpEntity<>(request, headers);

        try {
            log.debug("Calling AI Service Validate endpoint at {}", url);
            ResponseEntity<R> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    responseType
            );

            if (response.getBody() == null) {
                throw new AiIntegrationException("AI Service Validate endpoint returned empty response");
            }

            return response.getBody();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("AI Service returned HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new AiIntegrationException("AI Service returned HTTP " + e.getStatusCode() + ". Body: " + e.getResponseBodyAsString(), e);
        } catch (RestClientException e) {
            log.error("Failed to communicate with AI Service Validate endpoint: {}", e.getMessage(), e);
            throw new AiIntegrationException("Failed to communicate with AI Service Validate endpoint: " + e.getMessage(), e);
        }
    }

    @Override
    public com.acronexus.dto.ai.AiMatchResponse matchData(com.acronexus.dto.ai.AiMatchRequest request) {
        String url = aiServiceProperties.getBaseUrl() + "/match";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<com.acronexus.dto.ai.AiMatchRequest> entity = new HttpEntity<>(request, headers);

        try {
            log.debug("Calling AI Service Match endpoint at {}", url);
            ResponseEntity<com.acronexus.dto.ai.AiMatchResponse> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    com.acronexus.dto.ai.AiMatchResponse.class
            );

            if (response.getBody() == null) {
                throw new AiIntegrationException("AI Service Match endpoint returned empty response");
            }

            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to communicate with AI Service Match endpoint: {}", e.getMessage(), e);
            throw new AiIntegrationException("Failed to communicate with AI Service Match endpoint: " + e.getMessage(), e);
        }
    }

    @Override
    public com.acronexus.dto.ai.AiInsightDto getInsights(com.acronexus.dto.ai.AiAnalyticsRequest request) {
        String url = aiServiceProperties.getBaseUrl() + "/analyze";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<com.acronexus.dto.ai.AiAnalyticsRequest> entity = new HttpEntity<>(request, headers);

        try {
            log.debug("Calling AI Service Analyze endpoint at {}", url);
            ResponseEntity<com.acronexus.dto.ai.AiInsightDto> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    com.acronexus.dto.ai.AiInsightDto.class
            );

            if (response.getBody() == null) {
                throw new AiIntegrationException("AI Service Analyze endpoint returned empty response");
            }

            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to communicate with AI Service Analyze endpoint: {}", e.getMessage(), e);
            throw new AiIntegrationException("Failed to communicate with AI Service Analyze endpoint: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean checkHealth() {
        String url = aiServiceProperties.getBaseUrl() + "/health";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<java.util.Map> response = aiServiceRestTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    java.util.Map.class
            );

            if (response.getBody() != null) {
                Object groqOnline = response.getBody().get("groq_online");
                boolean isHealthy = Boolean.TRUE.equals(groqOnline);
                log.info("AI Service health check: groq_online={}", isHealthy);
                return isHealthy;
            }
            return false;
        } catch (Exception e) {
            log.error("AI Service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
