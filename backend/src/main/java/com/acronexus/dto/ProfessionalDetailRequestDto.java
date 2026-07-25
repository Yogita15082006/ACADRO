package com.acronexus.dto;

import lombok.Data;

@Data
public class ProfessionalDetailRequestDto {
    private String resumeUrl;
    private Object publications;
    private Object certifications;
}
