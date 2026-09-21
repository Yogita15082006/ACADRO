package com.acronexus.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface StudentLoginHistoryService {

    /** Record a successful student login */
    void recordLogin(UUID studentUserId);

    /** Get classes accessible to the logged-in user (HOD or Coordinator) */
    List<Map<String, Object>> getAccessibleClasses(UUID userId);

    /** Get login summary for students in a given class or ALL classes */
    List<Map<String, Object>> getClassLoginSummary(String classId, UUID requesterId);

    /** Get complete login history for a specific student */
    Map<String, Object> getStudentLoginHistory(UUID studentId, UUID requesterId);
}
