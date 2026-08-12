package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityGenerationRequestDto {
    private EligibilityCriteria criteria;
    private EligibilitySettings settings;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EligibilityCriteria {
        private boolean attendance;
        private boolean assignment;
        private boolean quiz;
        private boolean internalMarks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EligibilitySettings {
        private int attendance;
        private int assignment;
        private int quiz;
        private int internal;
    }
}
