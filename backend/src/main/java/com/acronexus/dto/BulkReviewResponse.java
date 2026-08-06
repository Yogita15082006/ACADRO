package com.acronexus.dto;

import java.util.List;

public class BulkReviewResponse {
    private List<StudentAttendanceRecordDTO> matched;
    private List<StudentAttendanceRecordDTO> unmatched;

    public List<StudentAttendanceRecordDTO> getMatched() {
        return matched;
    }

    public void setMatched(List<StudentAttendanceRecordDTO> matched) {
        this.matched = matched;
    }

    public List<StudentAttendanceRecordDTO> getUnmatched() {
        return unmatched;
    }

    public void setUnmatched(List<StudentAttendanceRecordDTO> unmatched) {
        this.unmatched = unmatched;
    }
}
