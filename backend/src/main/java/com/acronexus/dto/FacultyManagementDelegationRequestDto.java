package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyManagementDelegationRequestDto {
    private UUID assignedFacultyId;
    private UUID departmentId;
    private String taskPurpose;
    private LocalDateTime validUntil;
}
