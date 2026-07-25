package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicResourceDto {
    private UUID id;
    private String fileName;
    private String fileType;
    private String documentUrl;
    private String uploadedBy;
    private ZonedDateTime uploadedAt;
    private Map<String, Object> metadata;

}
