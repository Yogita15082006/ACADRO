package com.acronexus.dto.response;

import lombok.Data;
import java.util.UUID;
import java.time.Instant;

@Data
public class NotificationResponse {
    private UUID id;
    private UUID targetUserId;
    private String module;
    private String title;
    private String message;
    private String actionPath;
    private String type;
    private Boolean isRead;
    private Instant createdAt;
    private Instant readAt;
    private String referenceId;
}
