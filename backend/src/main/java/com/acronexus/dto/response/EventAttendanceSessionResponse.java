package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventAttendanceSessionResponse {
    private UUID id;
    private String halfType;
    private String selectedLectures;
    private String status;
    private String attendanceCode;
    private Integer timerDurationMinutes;
    private Instant sessionStartTime;
    private Integer uniqueCodeCount;
    private Boolean isIncludedInOverall;
    
    // Statistics
    private Long totalRegistered;
    private Long attendanceSubmitted;
    private Long pending;
    private Long absent;
    
    private Boolean isSubmittedByCurrentUser;
}
