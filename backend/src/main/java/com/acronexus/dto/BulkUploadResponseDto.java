package com.acronexus.dto;

import com.acronexus.entity.ProcessingStatus;
import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class BulkUploadResponseDto {
    private UUID id;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private String uploadedBy;
    private ProcessingStatus processingStatus;
    private Integer totalRecords;
    private Integer successfullyInserted;
    private Integer updatedRecords;
    private Integer failedRecords;
    private Integer skippedRecords;
    private Integer duplicateRecords;
    private List<UploadErrorDto> errorLog;
    private Long processingTimeMs;
    private Instant uploadedAt;
    private Instant completedAt;
    
    // For preview mode only
    private List<PreviewResultRowDto> previewRows;
}
