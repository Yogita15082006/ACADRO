package com.acronexus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class BulkExamResultRequestDto {
    @NotNull(message = "Examination ID is required")
    private UUID examinationId;

    @NotNull(message = "Exam date is required")
    private java.time.LocalDate examDate;

    @NotNull(message = "Class Subject ID is required")
    private UUID classSubjectId;

    @NotEmpty(message = "Results list cannot be empty")
    @Valid
    private List<ExamResultRequestDto> results;
}
