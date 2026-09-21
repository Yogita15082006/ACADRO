package com.acronexus.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PreviewResultRowDto {
    private UUID studentId;
    private String enrollmentNumber;
    private String studentName;
    private BigDecimal marksObtained;
    private BigDecimal maxMarks;
    private String grade;
    private boolean valid;
    private String errorMessage;
}
