package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventAttendanceRecordResponse {
    private UUID studentId;
    private String studentName;
    private String enrollmentNo;
    private String batchYear;
    private String semester;
    private String className;
    private Integer uniqueCodeUsed;
    private Instant submittedAt;
    private String status; // SUBMITTED, ABSENT, NOT_SUBMITTED, PENDING
}
