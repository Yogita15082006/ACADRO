package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ExaminationEligibilityStudentDto {
    private UUID id;
    private UUID studentId;
    private String enrollmentNumber;
    private String name;
    private String className;
    private Boolean isEligible;
    private String reason;
    private Double overallAttendance;
    private Double assignmentPercentage;
    private Double quizPercentage;
    private Double internalPercentage;
}
