package com.acronexus.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TeachingHistoryDTO {
    private UUID classSubjectId;
    private String batch;
    private String year;
    private String semester;
    private String className;
    private String subjectName;
    private long totalScheduled;
    private long conducted;
    private long missed;
    private int overallAttendance;
}
