package com.acronexus.dto.response;

import lombok.Builder;
import lombok.Data;
import org.springframework.core.io.Resource;

@Data
@Builder
public class FileDownloadDto {
    private Resource resource;
    private String fileName;
    private String mimeType;
}
