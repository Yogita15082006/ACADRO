package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimetableVersionDto {
    private UUID id;
    private Integer versionNumber;
    private Boolean isActive;
    private String fileName;
    private String fileType;
    private Boolean isDeleted;
    private String uploadedBy;
    private ZonedDateTime uploadedAt;
    
    // Additional metadata for UI
    private String department;
    private String degree;
    private String academicYear;
    private String semester;
    private String batch;
    private String className;
}
