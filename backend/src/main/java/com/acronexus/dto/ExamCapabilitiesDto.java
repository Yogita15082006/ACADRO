package com.acronexus.dto;

import lombok.Data;

import java.util.List;

@Data
public class ExamCapabilitiesDto {
    private boolean canCreateExamination;
    private boolean canAssignExamCoordinator;
    private List<ExamCoordinatorAssignmentResponseDto> activeCoordinatorAssignments;
}
