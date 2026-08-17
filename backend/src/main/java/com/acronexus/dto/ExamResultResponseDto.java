package com.acronexus.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ExamResultResponseDto {
    private UUID id;
    private UUID examinationId;
    private String examinationName;
    private UUID studentId;
    private String studentName;
    private String enrollmentNo;
    private UUID subjectId;
    private String subjectName;
    private String subjectCode;
    private BigDecimal marksObtained;
    private BigDecimal maxMarks;
    private String grade;
    private String remarks;

    @com.fasterxml.jackson.annotation.JsonProperty("isPublished")
    private Boolean isPublished;
    
    private String className;
}
