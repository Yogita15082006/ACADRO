package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiFacultyValidationResultDto {
    private int totalAnalyzed;
    private int issuesFound;
    private List<AiValidationIssue> issues;
    private String aiSummary;
    private List<Map<String, String>> rawRecords;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiValidationIssue {
        private Integer rowNumber;
        private String field;
        private String originalValue;
        private String suggestedValue;
        private String issueDescription;
    }
}
