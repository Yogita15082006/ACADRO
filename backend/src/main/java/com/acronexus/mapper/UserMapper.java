package com.acronexus.mapper;

import com.acronexus.dto.UserRequestDto;
import com.acronexus.dto.UserResponseDto;
import com.acronexus.entity.Faculty;
import com.acronexus.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserRequestDto dto) {
        if (dto == null) return null;
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPassword()); // Normally hashed in service layer
        user.setRole(dto.getRole());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhone(dto.getPhone());
        user.setGender(dto.getGender());
        user.setDob(dto.getDob());
        user.setBloodGroup(dto.getBloodGroup());
        user.setProfilePictureUrl(dto.getProfilePictureUrl());
        return user;
    }

    public UserResponseDto toDto(User entity) {
        return toDto(entity, null);
    }

    public UserResponseDto toDto(User entity, Faculty faculty) {
        if (entity == null) return null;
        UserResponseDto dto = new UserResponseDto();
        dto.setId(entity.getId());
        dto.setEmail(entity.getEmail());
        dto.setRole(entity.getRole());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        
        // Compute full name
        String fn = entity.getFirstName() != null ? entity.getFirstName() : "";
        String ln = entity.getLastName() != null ? entity.getLastName() : "";
        dto.setName((fn + " " + ln).trim());
        
        dto.setPhone(entity.getPhone());
        dto.setGender(entity.getGender());
        dto.setDob(entity.getDob());
        dto.setBloodGroup(entity.getBloodGroup());
        dto.setProfilePictureUrl(entity.getProfilePictureUrl());
        dto.setIsActive(entity.getIsActive());
        
        // Department
        if (entity.getDepartment() != null) {
            UserResponseDto.DepartmentInfo deptInfo = new UserResponseDto.DepartmentInfo();
            deptInfo.setId(entity.getDepartment().getId());
            deptInfo.setName(entity.getDepartment().getName());
            dto.setDepartment(deptInfo);
        }
        
        // Faculty-specific fields
        if (faculty != null) {
            dto.setDesignation(faculty.getDesignation());
            dto.setEmployeeId(faculty.getEmployeeId());
            dto.setQualification(faculty.getQualification());
            dto.setExperienceYears(faculty.getExperienceYears());
        }
        
        return dto;
    }
}

