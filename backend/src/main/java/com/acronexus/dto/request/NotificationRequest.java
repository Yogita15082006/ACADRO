package com.acronexus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class NotificationRequest {
    @NotNull(message = "Target user ID is required")
    private UUID targetUserId;

    private String module;

    @NotBlank(message = "Title is required")
    private String title;

    private String message;
    private String actionPath;
    private String type;
    private String referenceId;
}
