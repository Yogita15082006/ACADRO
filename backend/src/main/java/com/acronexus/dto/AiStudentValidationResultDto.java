package com.acronexus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiStudentValidationResultDto {
    private int totalAnalyzed;
    private int issuesFound;
    private List<AiValidationIssue> issues;
    private String aiSummary;
    private List<java.util.Map<String, String>> rawRecords;

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
