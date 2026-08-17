package com.acronexus.mapper;

import com.acronexus.dto.NoticeDto;
import com.acronexus.entity.Notice;
import org.springframework.stereotype.Component;

@Component
public class NoticeMapper {

    public NoticeDto toDto(Notice notice) {
        if (notice == null) {
            return null;
        }

        NoticeDto dto = new NoticeDto();
        dto.setId(notice.getId());
        dto.setTitle(notice.getTitle());
        dto.setDescription(notice.getDescription());
        dto.setCategory(notice.getCategory());
        dto.setPriority(notice.getPriority());
        
        if (notice.getFile() != null) {
            dto.setFileId(notice.getFile().getId());
            dto.setFileUrl(notice.getFile().getDocumentUrl());
        }
        
        dto.setPublishDate(notice.getPublishDate());
        
        if (notice.getPublishedBy() != null) {
            dto.setPublishedById(notice.getPublishedBy().getId());
            dto.setPublishedByName(notice.getPublishedBy().getFirstName() + " " + notice.getPublishedBy().getLastName());
        }
        
        dto.setExpiryDate(notice.getExpiryDate());
        
        if (notice.getTargetAssignments() != null) {
            java.util.List<com.acronexus.dto.NoticeTargetAssignmentDto> targets = notice.getTargetAssignments().stream().map(ta -> {
                com.acronexus.dto.NoticeTargetAssignmentDto targetDto = new com.acronexus.dto.NoticeTargetAssignmentDto();
                targetDto.setBatchYear(ta.getBatchYear());
                targetDto.setAcademicYear(ta.getAcademicYear());
                targetDto.setSemester(ta.getSemester());
                targetDto.setIsEntireBatch(ta.getIsEntireBatch());
                if (ta.getAcroClass() != null) {
                    targetDto.setAcroClassId(ta.getAcroClass().getId());
                    targetDto.setAcroClassName(ta.getAcroClass().getName() + 
                        (ta.getAcroClass().getSection() != null ? " - " + ta.getAcroClass().getSection() : ""));
                }
                return targetDto;
            }).collect(java.util.stream.Collectors.toList());
            dto.setTargets(targets);
        }
        
        dto.setIsActive(notice.getIsActive());

        return dto;
    }
}
