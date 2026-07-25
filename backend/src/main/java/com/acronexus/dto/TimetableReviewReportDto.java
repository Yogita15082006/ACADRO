package com.acronexus.dto;

import lombok.Data;
import java.util.List;

@Data
public class TimetableReviewReportDto {
    private String fileName;
    private String uploadedAt;
    private String department;
    private String degree;
    private String academicYear;
    private String className;
    private String batch;
    private Integer semester;
    
    private List<ParsedSubjectAssignmentDto> subjectAssignments;
    private List<ParsedCoordinatorAssignmentDto> coordinatorAssignments;
    private List<ParsedSlotDto> timetableSlots;
    
    private List<String> unknowns;
    private List<String> conflicts;
}
