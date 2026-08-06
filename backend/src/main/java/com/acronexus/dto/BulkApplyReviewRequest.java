package com.acronexus.dto;

import java.util.List;
import java.util.UUID;

public class BulkApplyReviewRequest {
    private List<UUID> approveIds;
    private List<UUID> rejectIds;
    private String approvalSource;
    private String remarks;

    public List<UUID> getApproveIds() {
        return approveIds;
    }

    public void setApproveIds(List<UUID> approveIds) {
        this.approveIds = approveIds;
    }

    public List<UUID> getRejectIds() {
        return rejectIds;
    }

    public void setRejectIds(List<UUID> rejectIds) {
        this.rejectIds = rejectIds;
    }

    public String getApprovalSource() {
        return approvalSource;
    }

    public void setApprovalSource(String approvalSource) {
        this.approvalSource = approvalSource;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
