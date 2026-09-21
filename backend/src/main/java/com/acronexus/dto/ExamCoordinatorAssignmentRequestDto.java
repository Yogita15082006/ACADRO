package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ExamCoordinatorAssignmentRequestDto {
    @NotNull(message = "Assigned user ID is required")
    private UUID assignedUserId;

    @NotBlank(message = "Exam purpose is required")
    private String examPurpose;

    @NotNull(message = "Valid until date is required")
    private LocalDate validUntil;
}
