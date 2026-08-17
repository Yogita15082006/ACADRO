package com.acronexus.dto;

import com.acronexus.entity.NoticePriority;
import com.acronexus.entity.UserRole;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

@Data
public class NoticeDto {
    private UUID id;
    private String title;
    private String description;
    private String category;
    private NoticePriority priority;
    private UUID fileId;
    private String fileUrl;
    private ZonedDateTime publishDate;
    private UUID publishedById;
    private String publishedByName;
    private ZonedDateTime expiryDate;
    private java.util.List<NoticeTargetAssignmentDto> targets;
    private UserRole targetRole;
    private Boolean isActive;
}
