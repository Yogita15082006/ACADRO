package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttendanceSubmitRequestDto {
    @NotBlank(message = "Attendance code is required")
    private String attendanceCode;
    
    // Future enhancements for verification
    private Double latitude;
    private Double longitude;
    private String faceData;
}
