package com.acronexus.mapper;

import com.acronexus.dto.ExaminationNoticeRequestDto;
import com.acronexus.dto.ExaminationNoticeResponseDto;
import com.acronexus.entity.ExaminationNotice;
import org.springframework.stereotype.Component;

@Component
public class ExaminationNoticeMapper {
    
    public ExaminationNotice toEntity(ExaminationNoticeRequestDto dto) {
        if (dto == null) return null;
        ExaminationNotice entity = new ExaminationNotice();
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setCategory(dto.getCategory());
        entity.setPriority(dto.getPriority());
        entity.setPublishDate(dto.getPublishDate());
        entity.setAttachmentFileId(dto.getAttachmentFileId());
        return entity;
    }

    public ExaminationNoticeResponseDto toDto(ExaminationNotice entity) {
        if (entity == null) return null;
        ExaminationNoticeResponseDto dto = new ExaminationNoticeResponseDto();
        dto.setId(entity.getId());
        if (entity.getExamination() != null) {
            dto.setExaminationId(entity.getExamination().getId());
        }
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setCategory(entity.getCategory());
        dto.setPriority(entity.getPriority());
        dto.setPublishDate(entity.getPublishDate());
        dto.setAttachmentFileId(entity.getAttachmentFileId());
        if (entity.getCreatedAt() != null) {
            dto.setCreatedAt(entity.getCreatedAt().toInstant());
        }
        return dto;
    }
}
