package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultContextRowDto {
    private UUID studentId;
    private UUID resultId;
    private String enrollmentNo;
    private String studentName;
    private String section;
    private BigDecimal marksObtained;
    private BigDecimal maxMarks;
    private String grade;
    private String remarks;
    private String attendanceStatus; // e.g. "PRESENT", "ABSENT", "NOT MARKED"
    @com.fasterxml.jackson.annotation.JsonProperty("isPublished")
    private Boolean isPublished;
    private String resultStatus; // "Saved", "Pending"
    private ExamAiFeedbackResponseDto aiFeedback;
}
