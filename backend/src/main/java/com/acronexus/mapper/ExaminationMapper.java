package com.acronexus.mapper;

import com.acronexus.dto.ExaminationRequestDto;
import com.acronexus.dto.ExaminationResponseDto;
import com.acronexus.entity.Examination;
import com.acronexus.entity.FileStorage;
import com.acronexus.repository.FileStorageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.stream.Collectors;

@Component
public class ExaminationMapper {

    @Autowired
    private FileStorageRepository fileStorageRepository;

    public Examination toEntity(ExaminationRequestDto dto) {
        if (dto == null) return null;
        Examination entity = new Examination();
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setCustomType(dto.getCustomType());
        entity.setBatch(dto.getBatch());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setDescription(dto.getDescription());
        // Timetable mapping is handled separately
        return entity;
    }

    public ExaminationResponseDto toDto(Examination entity) {
        if (entity == null) return null;
        ExaminationResponseDto dto = new ExaminationResponseDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setCustomType(entity.getCustomType());
        dto.setStatus(entity.getStatus());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setDescription(entity.getDescription());
        dto.setCreatedAt(entity.getCreatedAt());

        if (entity.getCreatedBy() != null) {
            dto.setCreatedBy(entity.getCreatedBy().getId());
            dto.setCreatedByName(entity.getCreatedBy().getFirstName() + " " + (entity.getCreatedBy().getLastName() != null ? entity.getCreatedBy().getLastName() : ""));
        }

        if (entity.getTimetables() != null && !entity.getTimetables().isEmpty()) {
            java.util.List<com.acronexus.dto.ExaminationTimetableDto> ttDtos = new java.util.ArrayList<>();
            for (com.acronexus.entity.ExaminationTimetable tt : entity.getTimetables()) {
                com.acronexus.dto.ExaminationTimetableDto td = new com.acronexus.dto.ExaminationTimetableDto();
                td.setId(tt.getId());
                td.setFileName(tt.getFileName());
                td.setFileSize(tt.getFileSize());
                if (tt.getCreatedBy() != null) {
                    td.setUploadedBy(tt.getCreatedBy().getFirstName() + " " + (tt.getCreatedBy().getLastName() != null ? tt.getCreatedBy().getLastName() : ""));
                } else {
                    td.setUploadedBy("Admin");
                }
                td.setUploadDate(tt.getCreatedAt() != null ? tt.getCreatedAt().toInstant() : java.time.Instant.now());
                ttDtos.add(td);
            }
            dto.setTimetables(ttDtos);
        }

        if (entity.getBatch() != null) {
            dto.setBatch(entity.getBatch());
        }

        if (entity.getDepartment() != null) {
            dto.setDepartmentId(entity.getDepartment().getId());
        }

        if (entity.getSemester() != null) {
            dto.setSemesterId(entity.getSemester().getId());
            dto.setSemesterName(String.valueOf(entity.getSemester().getSemesterNumber()));
        }

        if (entity.getAcademicYear() != null) {
            dto.setAcademicYearId(entity.getAcademicYear().getId());
            dto.setAcademicYearName(entity.getAcademicYear().getYear());
        }

        if (entity.getClasses() != null) {
            dto.setClassIds(entity.getClasses().stream().map(com.acronexus.entity.AcroClass::getId).collect(Collectors.toList()));
            dto.setClassNames(entity.getClasses().stream().map(c -> {
                if (c.getSection() != null && !c.getSection().isEmpty()) {
                    return c.getSection();
                }
                return c.getName();
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
