package com.acronexus.mapper;

import com.acronexus.dto.TimetableRequestDto;
import com.acronexus.dto.TimetableResponseDto;
import com.acronexus.entity.Timetable;
import org.springframework.stereotype.Component;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;

@Component
public class TimetableMapper {
    
    public Timetable toEntity(TimetableRequestDto dto) {
        if (dto == null) return null;
        Timetable entity = new Timetable();
        // Map fields if needed later
        return entity;
    }

    public TimetableResponseDto toDto(Timetable entity) {
        if (entity == null) return null;
        TimetableResponseDto dto = new TimetableResponseDto();
        dto.setId(entity.getId());
        dto.setType("Timetable");
        dto.setVersionNumber(entity.getVersionNumber());
        dto.setIsActive(entity.getIsActive());

        if (entity.getAcroClass() != null) {
            dto.setClassName(entity.getAcroClass().getName() + (entity.getAcroClass().getSection() != null ? " " + entity.getAcroClass().getSection() : ""));
            dto.setTitle(entity.getAcroClass().getName() + (entity.getAcroClass().getSection() != null ? " " + entity.getAcroClass().getSection() : "") + " Timetable V" + entity.getVersionNumber());
            
            if (entity.getBatch() != null && !entity.getBatch().isBlank()) {
                dto.setBatch(entity.getBatch());
            } else {
                dto.setBatch(entity.getAcroClass().getName());
            }
            
            if (entity.getAcroClass().getDepartment() != null) {
                dto.setDepartment(entity.getAcroClass().getDepartment().getName());
            }
            if (entity.getAcroClass().getDegreeProgram() != null) {
                dto.setDegree(entity.getAcroClass().getDegreeProgram().getName());
            }
        }

        if (entity.getSemester() != null) {
            dto.setSemester("Semester " + entity.getSemester().getSemesterNumber());
        }

        if (entity.getUploadedBy() != null) {
            dto.setUploader(entity.getUploadedBy().getFirstName() + " " + entity.getUploadedBy().getLastName());
            dto.setUploadedBy(entity.getUploadedBy().getFirstName() + " " + entity.getUploadedBy().getLastName());
        }

        if (entity.getUploadedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm").withZone(ZoneId.systemDefault());
            dto.setUpdated(formatter.format(entity.getUploadedAt()));
            dto.setUploadedAt(entity.getUploadedAt().toString());
        }

        if (entity.getFile() != null) {
            dto.setSize("PDF Document");
            dto.setFileName(entity.getFile().getFileName());
        } else {
            dto.setSize("Unknown");
            dto.setFileName("timetable.pdf");
        }

        if (entity.getAcademicYear() != null) {
            dto.setAcademicYear(entity.getAcademicYear().getYear());
        }

        return dto;
    }
}
