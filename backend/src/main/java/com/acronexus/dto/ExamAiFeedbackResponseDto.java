package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ExamAiFeedbackResponseDto {
    private UUID id;
    private UUID examinationId;
    private UUID studentId;
    private String overallPerformance;
    private String[] strengths;
    private String[] areasOfImprovement;
    private String actionPlan;
    private java.time.Instant generatedAt;
}
