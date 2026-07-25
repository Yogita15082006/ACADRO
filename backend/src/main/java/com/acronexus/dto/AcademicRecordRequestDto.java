package com.acronexus.dto;

import lombok.Data;

@Data
public class AcademicRecordRequestDto {
    private java.util.UUID studentId;
    private String educationLevel;
    private String institutionName;
    private Integer passingYear;
    private java.math.BigDecimal percentage;
    private String boardName;
    private String documentUrl;
}
