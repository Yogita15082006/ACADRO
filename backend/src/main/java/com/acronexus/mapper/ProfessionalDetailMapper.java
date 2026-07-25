package com.acronexus.mapper;

import com.acronexus.dto.ProfessionalDetailRequestDto;
import com.acronexus.dto.ProfessionalDetailResponseDto;
import com.acronexus.entity.ProfessionalDetail;
import org.springframework.stereotype.Component;

@Component
public class ProfessionalDetailMapper {
    
    public ProfessionalDetail toEntity(ProfessionalDetailRequestDto dto) {
        if (dto == null) return null;
        ProfessionalDetail entity = new ProfessionalDetail();
        entity.setResumeUrl(dto.getResumeUrl());
        entity.setPublications(dto.getPublications());
        entity.setCertifications(dto.getCertifications());
        return entity;
    }

    public ProfessionalDetailResponseDto toDto(ProfessionalDetail entity) {
        if (entity == null) return null;
        ProfessionalDetailResponseDto dto = new ProfessionalDetailResponseDto();
        if(entity.getId() != null) {
            dto.setId(entity.getId());
        }
        dto.setResumeUrl(entity.getResumeUrl());
        dto.setPublications(entity.getPublications());
        dto.setCertifications(entity.getCertifications());
        return dto;
    }
}
