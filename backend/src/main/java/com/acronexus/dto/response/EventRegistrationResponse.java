package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventRegistrationResponse {
    private UUID id;
    private UUID eventId;
    private String eventTitle;
    private UUID studentId;
    private String studentName;
    private String enrollmentNo;
    private String className;
    private String batchYear;
    private String currentYear;
    private String semester;
    private String email;
    private String phoneNumber;
    private Instant registeredAt;
    private String attendanceStatus;
    private Boolean certificateGenerated;
    private String customFormResponses;
}
