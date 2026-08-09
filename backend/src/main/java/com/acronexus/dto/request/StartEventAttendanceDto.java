package com.acronexus.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class StartEventAttendanceDto {
    @NotNull(message = "Unique code count is required")
    private Integer uniqueCodeCount;
    
    @NotNull(message = "Timer duration is required")
    private Integer timerDurationMinutes;
    
    private String halfType; // FIRST_HALF, SECOND_HALF, etc.
    
    private String selectedLectures; // JSON array string
    
    @NotNull(message = "Inclusion flag is required")
    private Boolean isIncludedInOverall;
    
    private String attendanceCode;
}
