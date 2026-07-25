package com.acronexus.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInsightDto {
    private Double confidence;
    private String reasoning;
    private List<String> recommendations;
    private String rawInsights; // Generic JSON payload
}
