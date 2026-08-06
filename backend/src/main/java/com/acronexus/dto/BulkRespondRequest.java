package com.acronexus.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class BulkRespondRequest {
    private List<UUID> attendanceIds;
    private boolean accept;
}
