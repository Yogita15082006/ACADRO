package com.acronexus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class EventRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String description;
    private String venue;
    @NotNull(message = "Event date is required")
    private Instant eventDate;
    private String category;
    private String startTime;
    private String endTime;
    private String mode;
    private String locationLink;

    private Instant registrationStart;
    private Instant registrationEnd;
    private Integer maxParticipants;
    private Double registrationFee;
    private Boolean allowWaitingList;
    private String registrationMethod;
    private String registrationExternalLink;
    private String aiRegistrationFormConfig;
    private String rulesAndGuidelines;

    private UUID departmentId;
    private UUID targetClassId;
    private UUID posterFileId;
    private UUID paymentQrFileId;
    private Boolean isActive = true;
    private Boolean isAttendanceEnabled = false;

    // Nested configurations
    private java.util.List<EventTargetAssignmentDto> targets;
}
