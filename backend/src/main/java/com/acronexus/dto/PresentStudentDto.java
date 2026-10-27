package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresentStudentDto {
    private UUID studentId;
    private String enrollmentNo;
    private String studentName;
    private String section;
    private String category; // "APPEARED", "ELIGIBLE_NOT_APPEARED", "NOT_ELIGIBLE"
    private Boolean isEligible;
    private String eligibilityReason;
    private String appearanceStatus; // "PRESENT", "ABSENT", "NO_RECORD"
    private String appearanceDetail;
    private Double attendancePercentage;
    private BigDecimal marksObtained;
    private String grade;
    private Boolean isPublished;

    public PresentStudentDto(String enrollmentNo, String studentName, String section) {
        this.enrollmentNo = enrollmentNo;
        this.studentName = studentName;
        this.section = section;
    }
}

