package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventAttendanceSessionResponse {
    private UUID id;
    private Integer lectureCount;
    private String status;
    private String attendanceCode;
    private Integer timerDurationMinutes;
    private Instant sessionStartTime;
    private Integer uniqueCodeCount;
    private Boolean isIncludedInOverall;
    private Integer selectedSubjectCount;
    
    // Statistics
    private Long totalRegistered;
    private Long attendanceSubmitted;
    private Long pending;
    private Long absent;
    
    private Boolean isSubmittedByCurrentUser;
}
