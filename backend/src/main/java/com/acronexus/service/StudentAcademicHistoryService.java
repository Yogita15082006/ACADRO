package com.acronexus.service;

import com.acronexus.dto.response.StudentAcademicHistoryResponseDto;
import java.util.List;
import java.util.UUID;

public interface StudentAcademicHistoryService {
    List<StudentAcademicHistoryResponseDto> getFilteredHistory(UUID academicYearId, UUID classId, String section, UUID semesterId, String status, String search);
    List<StudentAcademicHistoryResponseDto> getStudentHistory(UUID studentId);
}
