package com.acronexus.dto.request;

import lombok.Data;
import java.util.UUID;

@Data
public class EventTargetAssignmentDto {
    private UUID acroClassId;
    private String batchYear;
    private String academicYear;
    private String semester;
    private String acroClassName;
    private Boolean isEntireBatch;
}
