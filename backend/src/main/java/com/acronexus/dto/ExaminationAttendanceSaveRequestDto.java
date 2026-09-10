package com.acronexus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationAttendanceSaveRequestDto {
    @NotEmpty(message = "Attendance list cannot be empty")
    @Valid
    private List<ExaminationAttendanceDto> attendanceList;
}
