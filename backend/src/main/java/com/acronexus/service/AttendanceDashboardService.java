package com.acronexus.service;

import com.acronexus.dto.AttendanceDashboardDto.*;
import java.util.List;
import java.util.UUID;

public interface AttendanceDashboardService {
    
    // Student Dashboard
    List<StudentAttendanceHistoryDto> getStudentAttendanceHistory(UUID studentId);
    List<SubjectAttendanceDto> getStudentSubjectWiseAttendance(UUID studentId);
    OverallAttendanceDto getStudentOverallAttendance(UUID studentId, UUID academicYearId, UUID semesterId);
    java.util.Map<UUID, OverallAttendanceDto> getStudentOverallAttendanceInBulk(List<UUID> studentIds, UUID academicYearId, UUID semesterId);
    List<MonthlyAttendanceDto> getStudentMonthlyAttendance(UUID studentId, UUID academicYearId, UUID semesterId);
    
    // Faculty Dashboard
    List<FacultyAttendanceHistoryDto> getFacultyAttendanceHistory(UUID facultyId);
    List<DailyAttendanceRegisterDto> getDailyAttendanceRegister(UUID classSubjectId, java.time.LocalDate date);
    ClassAttendanceSummaryDto getClassAttendanceSummary(UUID classSubjectId);
    
    // Admin Dashboard
    List<StudentAttendanceHistoryDto> adminStudentAttendanceLookup(String enrollmentNo, String studentName);
    List<FacultyAttendanceHistoryDto> adminFacultyAttendanceLookup(String facultyName, String employeeId);
    List<FacultyAttendanceHistoryDto> adminClassAttendanceLookup(UUID academicYearId, UUID semesterId, UUID classId, UUID subjectId);
}
