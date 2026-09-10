package com.acronexus.dto;

import com.acronexus.entity.DelegationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;
import com.acronexus.entity.Department;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyManagementDelegationResponseDto {
    private UUID id;
    private UserResponseDto assignedFaculty;
    private Department department;
    private String taskPurpose;
    private UserResponseDto assignedBy;
    private DelegationStatus status;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
    private LocalDateTime validUntil;
    private boolean isActive;
}
