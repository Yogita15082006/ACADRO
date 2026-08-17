package com.acronexus.dto;

import com.acronexus.entity.NoticePriority;
import com.acronexus.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

@Data
public class NoticeRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Notice Type/Category is required")
    private String category;
    
    @NotNull(message = "Priority is required")
    private NoticePriority priority;
    
    private UUID fileId;
    
    private ZonedDateTime publishDate;
    private ZonedDateTime expiryDate; 
    
    private java.util.List<NoticeTargetAssignmentDto> targets;
    private UserRole targetRole;
}
