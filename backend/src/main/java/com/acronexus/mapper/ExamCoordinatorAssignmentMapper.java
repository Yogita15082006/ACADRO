package com.acronexus.mapper;

import com.acronexus.dto.ExamCoordinatorAssignmentResponseDto;
import com.acronexus.entity.ExamCoordinatorAssignment;
import org.springframework.stereotype.Component;

@Component
public class ExamCoordinatorAssignmentMapper {

    public ExamCoordinatorAssignmentResponseDto toDto(ExamCoordinatorAssignment entity) {
        if (entity == null) {
            return null;
        }

        ExamCoordinatorAssignmentResponseDto dto = new ExamCoordinatorAssignmentResponseDto();
        dto.setId(entity.getId());
        
        if (entity.getAssignedUser() != null) {
            dto.setAssignedUserId(entity.getAssignedUser().getId());
            dto.setAssignedUserName(entity.getAssignedUser().getFirstName() + " " + (entity.getAssignedUser().getLastName() != null ? entity.getAssignedUser().getLastName() : ""));
            dto.setAssignedUserEmail(entity.getAssignedUser().getEmail());
        }
        
        if (entity.getDepartment() != null) {
            dto.setDepartmentName(entity.getDepartment().getName());
        }
        
        dto.setExamPurpose(entity.getExamPurpose());
        dto.setValidUntil(entity.getValidUntil());
        dto.setIsActive(entity.getIsActive());
        
        if (entity.getAssignedBy() != null) {
            dto.setAssignedById(entity.getAssignedBy().getId());
            dto.setAssignedByName(entity.getAssignedBy().getFirstName() + " " + (entity.getAssignedBy().getLastName() != null ? entity.getAssignedBy().getLastName() : ""));
        }
        
        dto.setCreatedAt(entity.getCreatedAt());
        
        return dto;
    }
}
