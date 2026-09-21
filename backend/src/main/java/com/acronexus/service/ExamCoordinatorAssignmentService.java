package com.acronexus.service;

import com.acronexus.dto.ExamCapabilitiesDto;
import com.acronexus.dto.ExamCoordinatorAssignmentRequestDto;
import com.acronexus.dto.ExamCoordinatorAssignmentResponseDto;
import com.acronexus.dto.UserResponseDto;

import java.util.List;
import java.util.UUID;

public interface ExamCoordinatorAssignmentService {
    ExamCoordinatorAssignmentResponseDto assignCoordinator(ExamCoordinatorAssignmentRequestDto requestDto);
    void revokeAssignment(UUID assignmentId);
    List<ExamCoordinatorAssignmentResponseDto> getDepartmentAssignments();
    List<ExamCoordinatorAssignmentResponseDto> getMyActiveAssignments();
    List<UserResponseDto> getEligibleFaculty();
    ExamCapabilitiesDto getMyCapabilities();
}
