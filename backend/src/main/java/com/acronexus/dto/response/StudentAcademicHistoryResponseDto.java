package com.acronexus.dto.response;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentAcademicHistoryResponseDto {
    private UUID enrollmentId;
    private UUID studentId;
    private String enrollmentNo;
    private String studentName;
    private String batchYear;
    private String admissionYear;
    
    private UUID academicYearId;
    private String academicYear;
    
    private UUID classId;
    private String className;
    private String section;
    
    private UUID semesterId;
    private Integer semesterNumber;
    
    private Double attendancePercentage;
    private Double midTermMarks;
    private Double sgpa;
    private Double cgpa;
    
    private String status;
}
