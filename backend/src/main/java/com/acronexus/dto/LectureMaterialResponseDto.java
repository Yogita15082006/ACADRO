package com.acronexus.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class LectureMaterialResponseDto {
    private UUID id;
    private String title;
    private String description;
    private Integer unitNumber;
    private Integer versionNumber;
    private UUID classSubjectId;
    private String subjectName;
    private String subjectCode;
    private String acroClassName;
    private UUID fileId;
    private String documentUrl;
    private String fileType;
    private String fileName;
    private String uploadedByName;
    private Instant uploadedAt;

    private String unit;
    private String department;
    private String batch;
    private String year;
    private String semester;
    private String className;
    private String facultyName;
    private Instant updatedAt;
    private Boolean isDeleted;
}
