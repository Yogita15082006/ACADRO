package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class AcademicRecordResponseDto {
    private UUID id;
    private UUID studentId;
    private String educationLevel;
    private String institutionName;
    private Integer passingYear;
    private java.math.BigDecimal percentage;
    private String boardName;
    private String documentUrl;
}
