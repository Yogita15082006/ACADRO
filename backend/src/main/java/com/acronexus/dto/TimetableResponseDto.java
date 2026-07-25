package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class TimetableResponseDto {
    private UUID id;
    private String title;
    private String type; // "Timetable"
    private String className;
    private String semester;
    private String updated;
    private String uploader;
    private String size;
    private Integer versionNumber;
    private Boolean isActive;
    
    // UI Metadata fields
    private String fileName;
    private String department;
    private String degree;
    private String academicYear;
    private String batch;
    private String uploadedAt;
    private String uploadedBy;
}
