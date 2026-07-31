package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ClassSubjectResponseDto {
    private UUID id;
    private UUID classId;
    private String className;
    private String year;
    private String semester;
    private UUID subjectId;
    private String subjectName;
    private String subjectCode;
    private UUID facultyId;
    private String facultyName;
    private String coordinatorName;
    private String generationType;
    
    // Additional metadata for Subject Cards
    private String department;
    private String batch;
    private String classSection;
}
