package com.acronexus.dto;

import lombok.Data;

@Data
public class ParsedSubjectAssignmentDto {
    private String facultyId;
    private String originalFacultyName;
    private String matchedFacultyName;
    
    private String subjectId;
    private String originalSubjectCode;
    private String originalSubjectName;
    private String originalSubjectType;
    private String matchedSubjectName;
    
    private String subjectCode; // The matched subject code
    private String classId;
    private String className;
}
