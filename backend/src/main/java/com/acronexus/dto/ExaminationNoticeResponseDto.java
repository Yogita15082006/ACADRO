package com.acronexus.dto;

import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ExaminationNoticeResponseDto {
    private UUID id;
    private UUID examinationId;
    private String title;
    private String description;
    private String category;
    private String priority;
    private LocalDate publishDate;
    private UUID attachmentFileId;
    private Instant createdAt;
}
