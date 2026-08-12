package com.acronexus.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class ExaminationTimetableDto {
    private UUID id;
    private String fileName;
    private Long fileSize;
    private String uploadedBy;
    private Instant uploadDate;
}
