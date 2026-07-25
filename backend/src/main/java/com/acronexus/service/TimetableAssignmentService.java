package com.acronexus.service;

import com.acronexus.dto.TimetableReviewReportDto;
import java.util.UUID;

public interface TimetableAssignmentService {
    TimetableReviewReportDto performAiMatch(UUID timetableId, UUID requestedBy);
    void confirmAssignments(UUID timetableId, TimetableReviewReportDto reviewDto, UUID requestedBy);
}
