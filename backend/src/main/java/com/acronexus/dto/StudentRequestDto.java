package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StudentRequestDto {
    @NotBlank
    private String enrollmentNumber;
    
    @NotBlank
    private String name;
    
    private String gender;
    
    private String batch;
    
    private String status;
    
    private java.util.UUID classId;
    
    private java.util.UUID academicYearId;
    
    private java.util.UUID semesterId;
}
