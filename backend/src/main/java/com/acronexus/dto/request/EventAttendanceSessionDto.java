package com.acronexus.dto.request;

import lombok.Data;

@Data
public class EventAttendanceSessionDto {
    private String halfType;
    private String selectedLectures;
    private Integer timerDurationMinutes;
    private Integer uniqueCodeCount;
    private Boolean isIncludedInOverall;
    private java.util.List<java.util.UUID> classSubjectIds;
}
