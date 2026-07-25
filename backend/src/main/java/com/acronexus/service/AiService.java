package com.acronexus.service;

import com.acronexus.dto.ai.AiGenericRequest;
import com.acronexus.dto.ai.AiGenericResponse;

public interface AiService {
    AiGenericResponse generateContent(AiGenericRequest request);
    
    String extractTimetable(String fileUrl);
    
    java.util.Map<String, Object> parseSyllabus(String fileUrl);

    <T, R> R validateData(T request, Class<R> responseType);
    com.acronexus.dto.ai.AiMatchResponse matchData(com.acronexus.dto.ai.AiMatchRequest request);
    com.acronexus.dto.ai.AiInsightDto getInsights(com.acronexus.dto.ai.AiAnalyticsRequest request);
    boolean checkHealth();
}
