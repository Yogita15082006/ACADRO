package com.acronexus.mapper;

import com.acronexus.dto.LectureMaterialRequestDto;
import com.acronexus.dto.LectureMaterialResponseDto;
import com.acronexus.entity.LectureMaterial;
import org.springframework.stereotype.Component;

@Component
public class LectureMaterialMapper {
    
    public LectureMaterial toEntity(LectureMaterialRequestDto dto) {
        if (dto == null) return null;
        LectureMaterial entity = new LectureMaterial();
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setUnitNumber(dto.getUnitNumber());
        if(dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }
        return entity;
    }

    public LectureMaterialResponseDto toDto(LectureMaterial entity) {
        if (entity == null) return null;
        LectureMaterialResponseDto dto = new LectureMaterialResponseDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setUnitNumber(entity.getUnitNumber());
        dto.setVersionNumber(entity.getVersionNumber());
        
        if (entity.getClassSubject() != null) {
            dto.setClassSubjectId(entity.getClassSubject().getId());
            if (entity.getClassSubject().getSubject() != null) {
                dto.setSubjectName(entity.getClassSubject().getSubject().getName());
                dto.setSubjectCode(entity.getClassSubject().getSubject().getCode());
            }
            if (entity.getClassSubject().getAcroClass() != null) {
                dto.setAcroClassName(entity.getClassSubject().getAcroClass().getName());
            }
        }
        
        if (entity.getFile() != null) {
            dto.setFileId(entity.getFile().getId());
            dto.setDocumentUrl(entity.getFile().getDocumentUrl());
            dto.setFileType(entity.getFile().getFileType());
            dto.setFileName(entity.getFile().getFileName());
        }
        
        if (entity.getUploadedBy() != null) {
            dto.setUploadedByName(entity.getUploadedBy().getFirstName() + " " + entity.getUploadedBy().getLastName());
        }
        
        dto.setUploadedAt(entity.getUploadedAt());
        
        dto.setUnit(entity.getUnit() != null ? entity.getUnit() : (entity.getUnitNumber() != null ? "Unit " + entity.getUnitNumber() : "General"));
        dto.setDepartment(entity.getDepartment());
        dto.setBatch(entity.getBatch());
        dto.setYear(entity.getYear());
        dto.setSemester(entity.getSemester());
        dto.setClassName(entity.getClassName() != null ? entity.getClassName() : dto.getAcroClassName());
        dto.setFacultyName(entity.getFacultyName() != null ? entity.getFacultyName() : dto.getUploadedByName());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setIsDeleted(entity.getIsDeleted());
        if (entity.getFileName() != null && !entity.getFileName().isEmpty()) {
            dto.setFileName(entity.getFileName());
        }
        if (entity.getFileUrl() != null && !entity.getFileUrl().isEmpty()) {
            dto.setDocumentUrl(entity.getFileUrl());
        }
        
        return dto;
    }
}
