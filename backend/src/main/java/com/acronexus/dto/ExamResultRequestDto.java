package com.acronexus.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ExamResultRequestDto {
    @NotNull(message = "Examination ID is required")
    private UUID examinationId;

    @NotNull(message = "Student ID is required")
    private UUID studentId;

    // Left nullable for backward compatibility, but conceptually should be migrated to classSubjectId
    private UUID subjectId;

    private java.time.LocalDate examDate;
    private UUID classSubjectId;

    @PositiveOrZero(message = "Marks obtained must be positive or zero")
    private BigDecimal marksObtained;

    @NotNull(message = "Max marks is required")
    @PositiveOrZero(message = "Max marks must be positive or zero")
    private BigDecimal maxMarks;

    private String grade;
    private String remarks;
    private String modificationReason;
}
