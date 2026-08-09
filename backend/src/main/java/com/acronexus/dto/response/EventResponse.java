package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventResponse {
    private UUID id;
    private String title;
    private String description;
    private String venue;
    private Instant eventDate;
    private Instant registrationStart;
    private Instant registrationEnd;
    private Integer maxParticipants;
    private Long currentParticipants;
    private Boolean isRegistered;
    private Boolean isRegRequired;
    private String category;
    private String startTime;
    private String endTime;
    private String mode;
    private String locationLink;

    private Double registrationFee;
    private Boolean allowWaitingList;
    private String registrationMethod;
    private String registrationExternalLink;
    private String aiRegistrationFormConfig;
    private String rulesAndGuidelines;
    private String paymentQrFileUrl;

    private UUID departmentId;
    private String departmentName;
    private UUID targetClassId;
    private String targetClassName;
    
    // Additional target lists
    private java.util.List<String> targetBatches;
    private java.util.List<String> targetClasses;
    private java.util.List<com.acronexus.dto.request.EventTargetAssignmentDto> targets;
    
    // Attendance session basic info (if any)
    private Boolean isAttendanceConfigured;

    private String posterFileUrl;
    private Boolean isActive;
    
    private Boolean includeInOverallAttendance;
    private String status;
    private String creatorName;
    private Instant createdDate;
    
    private Instant createdAt;
    private Instant updatedAt;
}
