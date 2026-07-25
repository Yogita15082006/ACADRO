package com.acronexus.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalyticsRequest {
    private String insightType;
    private String contextType;
    private String contextId;
    private Map<String, Object> data;
}
