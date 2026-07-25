package com.acronexus.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenericRequest {
    private String systemPrompt;
    private String userPrompt;
    private Double temperature;
    private Integer maxTokens;
}
