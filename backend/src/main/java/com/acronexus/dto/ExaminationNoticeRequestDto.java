package com.acronexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ExaminationNoticeRequestDto {
    
    @NotNull(message = "Examination ID is required")
    private UUID examinationId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String category;
    private String priority;
    
    @NotNull(message = "Publish date is required")
    private LocalDate publishDate;
    
    private UUID attachmentFileId;
}
