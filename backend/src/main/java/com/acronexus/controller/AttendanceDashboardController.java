package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.AttendanceDashboardDto.*;
import com.acronexus.service.AttendanceDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import com.acronexus.security.UserDetailsImpl;

@RestController
@RequestMapping("/api/attendance-dashboard")
@RequiredArgsConstructor
public class AttendanceDashboardController {

    private final AttendanceDashboardService dashboardService;
    private final com.acronexus.repository.ClassSubjectRepository classSubjectRepository;

    // --- AUTHORIZATION HELPERS ---
    private void verifyStudentAccess(UUID studentId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isPrivileged = userDetails.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_ADMIN") || 
            a.getAuthority().equals("ROLE_COORDINATOR") || 
            a.getAuthority().equals("ROLE_HOD") || 
            a.getAuthority().equals("ROLE_FACULTY")
        );
        if (!isPrivileged && !userDetails.getId().equals(studentId)) {
            throw new AccessDeniedException("Access denied: You can only access your own data");
        }
    }

    private void verifyFacultyAccess(UUID facultyId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HOD"));
        if (!isAdmin && !userDetails.getId().equals(facultyId)) {
            throw new AccessDeniedException("Access denied: You can only access your own data");
        }
    }

    private void verifyClassSubjectAccess(UUID classSubjectId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HOD"));
        if (!isAdmin) {
            com.acronexus.entity.ClassSubject cs = classSubjectRepository.findById(classSubjectId)
                    .orElseThrow(() -> new IllegalArgumentException("ClassSubject not found"));
            if (cs.getFaculty() == null || !cs.getFaculty().getId().equals(userDetails.getId())) {
                throw new AccessDeniedException("Access denied: You can only access classes assigned to you");
            }
        }
    }

    // --- STUDENT ENDPOINTS ---

    @GetMapping("/student/{studentId}/history")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'COORDINATOR', 'FACULTY', 'HOD')")
    public ResponseEntity<ApiResponse<List<StudentAttendanceHistoryDto>>> getStudentAttendanceHistory(@PathVariable UUID studentId) {
        verifyStudentAccess(studentId);
        return ResponseEntity.ok(ApiResponse.success(
                "Student attendance history fetched successfully", 
                dashboardService.getStudentAttendanceHistory(studentId)
        ));
    }

    @GetMapping("/student/{studentId}/subject-wise")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'COORDINATOR', 'FACULTY', 'HOD')")
    public ResponseEntity<ApiResponse<List<SubjectAttendanceDto>>> getStudentSubjectWiseAttendance(@PathVariable UUID studentId) {
        verifyStudentAccess(studentId);
        return ResponseEntity.ok(ApiResponse.success(
                "Student subject-wise attendance fetched successfully", 
                dashboardService.getStudentSubjectWiseAttendance(studentId)
        ));
    }

    @GetMapping("/test/{studentId}")
    public ResponseEntity<ApiResponse<OverallAttendanceDto>> testOverall(@PathVariable UUID studentId) {
        return ResponseEntity.ok(ApiResponse.success("Test fetch", dashboardService.getStudentOverallAttendance(studentId)));
    }

    @GetMapping("/student/{studentId}/overall")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'COORDINATOR', 'FACULTY', 'HOD')")
    public ResponseEntity<ApiResponse<OverallAttendanceDto>> getStudentOverallAttendance(@PathVariable UUID studentId) {
        verifyStudentAccess(studentId);
        return ResponseEntity.ok(ApiResponse.success(
                "Student overall attendance fetched successfully", 
                dashboardService.getStudentOverallAttendance(studentId)
        ));
    }

    @GetMapping("/student/{studentId}/monthly")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'COORDINATOR', 'FACULTY', 'HOD')")
    public ResponseEntity<ApiResponse<List<MonthlyAttendanceDto>>> getStudentMonthlyAttendance(
            @PathVariable UUID studentId,
            @RequestParam UUID academicYearId,
            @RequestParam UUID semesterId) {
        verifyStudentAccess(studentId);
        return ResponseEntity.ok(ApiResponse.success(
                "Student monthly attendance fetched successfully", 
                dashboardService.getStudentMonthlyAttendance(studentId, academicYearId, semesterId)
        ));
    }

    // --- FACULTY ENDPOINTS ---

    @GetMapping("/faculty/{facultyId}/history")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FacultyAttendanceHistoryDto>>> getFacultyAttendanceHistory(@PathVariable UUID facultyId) {
        verifyFacultyAccess(facultyId);
        return ResponseEntity.ok(ApiResponse.success(
                "Faculty attendance history fetched successfully", 
                dashboardService.getFacultyAttendanceHistory(facultyId)
        ));
    }

    @GetMapping("/faculty/daily-register")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DailyAttendanceRegisterDto>>> getDailyAttendanceRegister(
            @RequestParam UUID classSubjectId,
            @RequestParam LocalDate date) {
        verifyClassSubjectAccess(classSubjectId);
        return ResponseEntity.ok(ApiResponse.success(
                "Daily attendance register fetched successfully", 
                dashboardService.getDailyAttendanceRegister(classSubjectId, date)
        ));
    }

    @GetMapping("/faculty/class-summary")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClassAttendanceSummaryDto>> getClassAttendanceSummary(
            @RequestParam UUID classSubjectId) {
        verifyClassSubjectAccess(classSubjectId);
        return ResponseEntity.ok(ApiResponse.success(
                "Class attendance summary fetched successfully", 
                dashboardService.getClassAttendanceSummary(classSubjectId)
        ));
    }

    // --- ADMIN / HOD ENDPOINTS ---

    @GetMapping("/admin/student-lookup")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<List<StudentAttendanceHistoryDto>>> adminStudentAttendanceLookup(
            @RequestParam(required = false) String enrollmentNo,
            @RequestParam(required = false) String studentName) {
        return ResponseEntity.ok(ApiResponse.success(
                "Student attendance lookup successful", 
                dashboardService.adminStudentAttendanceLookup(enrollmentNo, studentName)
        ));
    }

    @GetMapping("/admin/faculty-lookup")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<List<FacultyAttendanceHistoryDto>>> adminFacultyAttendanceLookup(
            @RequestParam(required = false) String facultyName,
            @RequestParam(required = false) String employeeId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Faculty attendance lookup successful", 
                dashboardService.adminFacultyAttendanceLookup(facultyName, employeeId)
        ));
    }

    @GetMapping("/admin/class-lookup")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<List<FacultyAttendanceHistoryDto>>> adminClassAttendanceLookup(
            @RequestParam UUID academicYearId,
            @RequestParam UUID semesterId,
            @RequestParam UUID classId,
            @RequestParam UUID subjectId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Class attendance lookup successful", 
                dashboardService.adminClassAttendanceLookup(academicYearId, semesterId, classId, subjectId)
        ));
    }
}
