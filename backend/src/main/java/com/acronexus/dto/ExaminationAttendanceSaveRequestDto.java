package com.acronexus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationAttendanceSaveRequestDto {
    private java.time.LocalDate examDate;

    // Mapping from Section ID (AcroClass ID) to ClassSubject ID
    private java.util.Map<java.util.UUID, java.util.UUID> sectionSubjectMap;

    @NotEmpty(message = "Attendance list cannot be empty")
    @Valid
    private List<ExaminationAttendanceDto> attendanceList;
}
