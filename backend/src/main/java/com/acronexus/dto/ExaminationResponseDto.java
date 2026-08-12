package com.acronexus.dto;

import com.acronexus.entity.ExamStatus;
import com.acronexus.entity.ExamType;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ExaminationResponseDto {
    private UUID id;
    private String batch;
    private UUID departmentId;
    private String departmentName;
    private UUID semesterId;
    private String semesterName;
    private String name;
    private ExamType type;
    private String customType;
    private ExamStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private UUID academicYearId;
    private String academicYearName;
    private java.util.List<UUID> classIds;
    private java.util.List<String> classNames;
    private String description;
    private java.util.List<ExaminationTimetableDto> timetables = new java.util.ArrayList<>();
    
    
    
    
    private Instant createdAt;
    private UUID createdBy;
    private String createdByName;
}
