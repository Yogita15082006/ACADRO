package com.acronexus.dto;

import lombok.Data;

@Data
public class ParsedSlotDto {
    private String dayOfWeek;
    private String timeSlot;
    private String roomNumber;
    private String subjectId;
    private String originalSubjectCode;
    private String originalSubjectName;
    private String originalSubjectType;
    private String matchedSubjectName;
    private String facultyId;
    private String originalFacultyName;
    private String matchedFacultyName;
}
