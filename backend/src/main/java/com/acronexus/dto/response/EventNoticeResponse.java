package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventNoticeResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID attachmentFileId;
    private String attachmentFileUrl;
    private Instant createdAt;
}
