package com.acronexus.dto;

import java.util.List;
import java.util.UUID;

public class CreateAutomateSessionRequest extends CreateAttendanceSessionRequest {
    private List<UUID> approveIds;

    public List<UUID> getApproveIds() {
        return approveIds;
    }

    public void setApproveIds(List<UUID> approveIds) {
        this.approveIds = approveIds;
    }
}
