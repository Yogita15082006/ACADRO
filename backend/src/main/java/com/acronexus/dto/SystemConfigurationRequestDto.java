package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigurationRequestDto {
    private boolean promoteStudents;
    private boolean resetAcademicData;
    private boolean updateDashboards;
    private UUID timetableId;
}
