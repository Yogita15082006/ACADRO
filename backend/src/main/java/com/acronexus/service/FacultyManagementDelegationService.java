package com.acronexus.service;

import com.acronexus.dto.FacultyManagementDelegationRequestDto;
import com.acronexus.dto.FacultyManagementDelegationResponseDto;

import java.util.List;
import java.util.UUID;

public interface FacultyManagementDelegationService {
    
    FacultyManagementDelegationResponseDto createDelegation(FacultyManagementDelegationRequestDto request, UUID hodId);
    
    FacultyManagementDelegationResponseDto completeDelegation(UUID delegationId, UUID facultyId);
    
    FacultyManagementDelegationResponseDto revokeDelegation(UUID delegationId, UUID hodId);
    
    List<FacultyManagementDelegationResponseDto> getDelegationsByHod(UUID hodId);
    
    List<FacultyManagementDelegationResponseDto> getActiveDelegationsForFaculty(UUID facultyId);
    
    boolean canManageFacultySetup(UUID userId, UUID departmentId);
    
    boolean canManageFacultySetup(UUID userId, String departmentName);
    
    boolean hasAnyActiveDelegation(UUID userId);
}
