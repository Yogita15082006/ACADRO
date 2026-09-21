package com.acronexus.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
public class ExamCoordinatorAssignmentResponseDto {
    private UUID id;
    private UUID assignedUserId;
    private String assignedUserName;
    private String assignedUserEmail;
    private String departmentName;
    private String examPurpose;
    private LocalDate validUntil;
    private Boolean isActive;
    private UUID assignedById;
    private String assignedByName;
    private ZonedDateTime createdAt;
}
