package com.acronexus.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationAttendanceDto {
    @NotNull(message = "Student ID cannot be null")
    private UUID studentId;
    
    @NotNull(message = "Attendance status cannot be null")
    private Boolean isPresent;
}
