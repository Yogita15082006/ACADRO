package com.acronexus.mapper;

import com.acronexus.dto.FacultyManagementDelegationResponseDto;
import com.acronexus.entity.FacultyManagementDelegation;

public class FacultyManagementDelegationMapper {
    public static FacultyManagementDelegationResponseDto toDto(FacultyManagementDelegation entity) {
        if (entity == null) return null;
        UserMapper userMapper = new UserMapper();
        return FacultyManagementDelegationResponseDto.builder()
                .id(entity.getId())
                .assignedFaculty(userMapper.toDto(entity.getAssignedFaculty()))
                .department(entity.getDepartment())
                .taskPurpose(entity.getTaskPurpose())
                .assignedBy(userMapper.toDto(entity.getAssignedBy()))
                .status(entity.getStatus())
                .assignedAt(entity.getAssignedAt())
                .completedAt(entity.getCompletedAt())
                .validUntil(entity.getValidUntil())
                .isActive(entity.isActive())
                .build();
    }
}
