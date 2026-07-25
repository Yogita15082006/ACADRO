package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ProfessionalDetailResponseDto {
    private UUID id;
    private String resumeUrl;
    private Object publications;
    private Object certifications;
}
