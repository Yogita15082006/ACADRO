package com.acronexus.mapper;

import com.acronexus.dto.AcademicRecordRequestDto;
import com.acronexus.dto.AcademicRecordResponseDto;
import com.acronexus.entity.AcademicRecord;
import org.springframework.stereotype.Component;

@Component
public class AcademicRecordMapper {
    
    public AcademicRecord toEntity(AcademicRecordRequestDto dto) {
        if (dto == null) return null;
        AcademicRecord entity = new AcademicRecord();
        entity.setEducationLevel(dto.getEducationLevel());
        entity.setInstitutionName(dto.getInstitutionName());
        entity.setPassingYear(dto.getPassingYear());
        entity.setPercentage(dto.getPercentage());
        entity.setDocumentUrl(dto.getDocumentUrl());
        return entity;
    }

    public AcademicRecordResponseDto toDto(AcademicRecord entity) {
        if (entity == null) return null;
        AcademicRecordResponseDto dto = new AcademicRecordResponseDto();
        if(entity.getId() != null) {
            dto.setId(entity.getId());
        }
        dto.setEducationLevel(entity.getEducationLevel());
        dto.setInstitutionName(entity.getInstitutionName());
        dto.setPassingYear(entity.getPassingYear());
        dto.setPercentage(entity.getPercentage());
        dto.setDocumentUrl(entity.getDocumentUrl());
        return dto;
    }
}
