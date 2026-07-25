package com.acronexus.service.impl;

import com.acronexus.dto.response.AdminDashboardResponse;
import com.acronexus.dto.response.FacultyDashboardResponse;
import com.acronexus.dto.response.HodDashboardResponse;
import com.acronexus.dto.response.StudentDashboardResponse;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ExaminationRepository examinationRepository;
    private final ExamScheduleRepository examScheduleRepository;
    private final NoticeRepository noticeRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final LectureMaterialRepository lectureMaterialRepository;
    private final SubjectVersionRepository subjectVersionRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final DepartmentRepository departmentRepository;
    private final AcroClassRepository acroClassRepository;
    private final SubjectRepository subjectRepository;

    // ======================== STUDENT DASHBOARD ========================

    @Override
    public StudentDashboardResponse getStudentDashboard(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Student student = studentRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        StudentEnrollment enrollment = studentEnrollmentRepository
                .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new RuntimeException("No active enrollment found"));

        UUID classId = enrollment.getAcroClass().getId();
        UUID departmentId = user.getDepartment().getId();
        UUID semesterId = enrollment.getSemester().getId();
        UUID academicYearId = enrollment.getAcademicYear().getId();

        return StudentDashboardResponse.builder()
                .attendanceOverview(buildAttendanceOverview(student.getId()))
                .subjectAttendance(buildSubjectAttendance(student.getId()))
                .upcomingAssignments(buildUpcomingAssignments(student.getId(), userId))
                .pendingAssignments(buildPendingAssignments(student.getId(), userId))
                .upcomingQuizzes(buildUpcomingQuizzes(student.getId(), userId))
                .recentQuizScores(buildRecentQuizScores(userId))
                .upcomingExams(buildUpcomingExams(classId, academicYearId, semesterId, departmentId))
                .latestNotices(buildStudentNotices(departmentId, classId))
                .latestNotifications(buildNotifications(userId))
                .academicResources(buildStudentAcademicResources(classId))
                .build();
    }

    private StudentDashboardResponse.AttendanceOverview buildAttendanceOverview(UUID studentId) {
        Object result = studentAttendanceRepository.getOverallAttendance(studentId);
        if (result == null) {
            return StudentDashboardResponse.AttendanceOverview.builder()
                    .totalClasses(0).classesAttended(0).attendancePercentage(0.0).build();
        }
        Object[] row = (Object[]) result;
        long total = row[0] != null ? ((Number) row[0]).longValue() : 0;
        long present = row[1] != null ? ((Number) row[1]).longValue() : 0;
        double percentage = total > 0 ? (present * 100.0 / total) : 0.0;
        return StudentDashboardResponse.AttendanceOverview.builder()
                .totalClasses(total)
                .classesAttended(present)
                .attendancePercentage(Math.round(percentage * 100.0) / 100.0)
                .build();
    }

    private List<StudentDashboardResponse.SubjectAttendance> buildSubjectAttendance(UUID studentId) {
        List<Object[]> results = studentAttendanceRepository.getSubjectWiseAttendance(studentId);
        return results.stream().map(row -> {
            String subjectName = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long attended = ((Number) row[2]).longValue();
            long missed = ((Number) row[3]).longValue();
            double pct = total > 0 ? (attended * 100.0 / total) : 0.0;
            return StudentDashboardResponse.SubjectAttendance.builder()
                    .subjectName(subjectName)
                    .totalClasses(total)
                    .classesAttended(attended)
                    .classesMissed(missed)
                    .percentage(Math.round(pct * 100.0) / 100.0)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.AssignmentSummary> buildUpcomingAssignments(UUID studentId, UUID userId) {
        List<Assignment> assignments = assignmentRepository.findAssignmentsForStudent(studentId);
        ZonedDateTime now = ZonedDateTime.now();
        return assignments.stream()
                .filter(a -> a.getDeadline() != null && a.getDeadline().isAfter(now))
                .sorted(Comparator.comparing(Assignment::getDeadline))
                .limit(5)
                .map(a -> {
                    boolean submitted = assignmentSubmissionRepository
                            .findByAssignmentIdAndStudentId(a.getId(), studentId).isPresent();
                    return StudentDashboardResponse.AssignmentSummary.builder()
                            .id(a.getId())
                            .title(a.getTitle())
                            .subjectName(a.getClassSubject().getSubject().getName())
                            .className(a.getClassSubject().getAcroClass().getName())
                            .deadline(a.getDeadline())
                            .maxMarks(a.getMaxMarks())
                            .submitted(submitted)
                            .build();
                }).collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.AssignmentSummary> buildPendingAssignments(UUID studentId, UUID userId) {
        List<Assignment> assignments = assignmentRepository.findAssignmentsForStudent(studentId);
        ZonedDateTime now = ZonedDateTime.now();
        return assignments.stream()
                .filter(a -> a.getDeadline() != null && a.getDeadline().isAfter(now))
                .filter(a -> assignmentSubmissionRepository
                        .findByAssignmentIdAndStudentId(a.getId(), studentId).isEmpty())
                .sorted(Comparator.comparing(Assignment::getDeadline))
                .limit(5)
                .map(a -> StudentDashboardResponse.AssignmentSummary.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .subjectName(a.getClassSubject().getSubject().getName())
                        .className(a.getClassSubject().getAcroClass().getName())
                        .deadline(a.getDeadline())
                        .maxMarks(a.getMaxMarks())
                        .submitted(false)
                        .build())
                .collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.QuizSummary> buildUpcomingQuizzes(UUID studentId, UUID userId) {
        List<Quiz> quizzes = quizRepository.findAvailableQuizzesForStudent(userId);
        Instant now = Instant.now();
        return quizzes.stream()
                .filter(q -> q.getEndTime() != null && q.getEndTime().isAfter(now))
                .filter(q -> !quizAttemptRepository.existsByQuiz_IdAndStudent_User_Id(q.getId(), userId))
                .sorted(Comparator.comparing(Quiz::getStartTime))
                .limit(5)
                .map(q -> StudentDashboardResponse.QuizSummary.builder()
                        .id(q.getId())
                        .title(q.getTitle())
                        .subjectName(q.getClassSubject().getSubject().getName())
                        .startTime(q.getStartTime())
                        .endTime(q.getEndTime())
                        .durationMinutes(q.getDurationMinutes())
                        .totalMarks(q.getTotalMarks())
                        .build())
                .collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.QuizScoreSummary> buildRecentQuizScores(UUID userId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent_User_Id(userId);
        return attempts.stream()
                .filter(a -> a.getCompletedAt() != null)
                .sorted(Comparator.comparing(QuizAttempt::getCompletedAt).reversed())
                .limit(5)
                .map(a -> StudentDashboardResponse.QuizScoreSummary.builder()
                        .quizId(a.getQuiz().getId())
                        .quizTitle(a.getQuiz().getTitle())
                        .score(a.getScore())
                        .totalMarks(a.getQuiz().getTotalMarks())
                        .completedAt(a.getCompletedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.ExamSummary> buildUpcomingExams(
            UUID classId, UUID academicYearId, UUID semesterId, UUID departmentId) {
        List<ExamSchedule> schedules = examScheduleRepository
                .findAllByStudentEnrollment(classId, academicYearId, semesterId, departmentId);
        java.time.LocalDate today = java.time.LocalDate.now();
        return schedules.stream()
                .filter(s -> s.getExamDate() != null && !s.getExamDate().isBefore(today))
                .sorted(Comparator.comparing(ExamSchedule::getExamDate)
                        .thenComparing(ExamSchedule::getStartTime))
                .limit(5)
                .map(s -> StudentDashboardResponse.ExamSummary.builder()
                        .id(s.getId())
                        .examinationName(s.getExamination().getName())
                        .subjectName(s.getSubject().getName())
                        .examDate(s.getExamDate())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .roomNumber(s.getRoomNumber())
                        .build())
                .collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.NoticeSummary> buildStudentNotices(UUID departmentId, UUID classId) {
        List<Notice> notices = noticeRepository.findStudentFeed(departmentId, classId);
        return notices.stream()
                .limit(5)
                .map(n -> StudentDashboardResponse.NoticeSummary.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .category(n.getCategory())
                        .priority(n.getPriority() != null ? n.getPriority().name() : null)
                        .publishDate(n.getPublishDate())
                        .build())
                .collect(Collectors.toList());
    }

    private List<StudentDashboardResponse.NotificationSummary> buildNotifications(UUID userId) {
        List<UserNotification> notifications = userNotificationRepository.findByUserIdWithUser(userId);
        return notifications.stream()
                .limit(5)
                .map(n -> StudentDashboardResponse.NotificationSummary.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private StudentDashboardResponse.AcademicResourceSummary buildStudentAcademicResources(UUID classId) {
        long lectureMaterialCount = lectureMaterialRepository.findActiveByClassId(classId).size();
        // Count class subjects to approximate available schemes/syllabus
        List<ClassSubject> classSubjects = classSubjectRepository.findByAcroClassIdAndIsActiveTrue(classId);
        long schemeCount = 0;
        long syllabusCount = 0;
        for (ClassSubject cs : classSubjects) {
            schemeCount += subjectVersionRepository
                    .findBySubjectIdAndAcademicYearIdAndSemesterIdAndResourceTypeOrderByVersionNumberDesc(
                            cs.getSubject().getId(), cs.getAcademicYear().getId(), cs.getSemester().getId(), "SCHEME").size();
            syllabusCount += subjectVersionRepository
                    .findBySubjectIdAndAcademicYearIdAndSemesterIdAndResourceTypeOrderByVersionNumberDesc(
                            cs.getSubject().getId(), cs.getAcademicYear().getId(), cs.getSemester().getId(), "SYLLABUS").size();
        }
        // NOTE: timetableCount is not supported by the existing schema.
        // Timetables are stored as files, not as discrete lecture slots.
        return StudentDashboardResponse.AcademicResourceSummary.builder()
                .schemeCount(schemeCount)
                .syllabusCount(syllabusCount)
                .lectureMaterialCount(lectureMaterialCount)
                .build();
    }

    // ======================== FACULTY DASHBOARD ========================

    @Override
    public FacultyDashboardResponse getFacultyDashboard(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long totalSubjects = classSubjectRepository.countByFacultyIdAndIsActiveTrue(userId);
        long totalClasses = classSubjectRepository.countDistinctClassesByFacultyId(userId);
        long pendingEvaluations = countPendingEvaluations(userId);
        long lectureMaterials = lectureMaterialRepository.countByUploadedByIdAndIsDeletedFalse(userId);

        // NOTE: todayClassCount and upcomingExamCount are not supported by the existing schema.
        // Timetables are stored as files (no discrete lecture slots) and exams are not mapped to specific faculty evaluators.
        return FacultyDashboardResponse.builder()
                .totalAssignedSubjects(totalSubjects)
                .totalClasses(totalClasses)
                .pendingEvaluations(pendingEvaluations)
                .upcomingQuizCount(countUpcomingFacultyQuizzes(userId))
                .lectureMaterialCount(lectureMaterials)
                .recentNotices(buildFacultyNotices(userId))
                .recentNotifications(buildFacultyNotifications(userId))
                .academicResources(buildFacultyAcademicResources(userId))
                .build();
    }

    private long countPendingEvaluations(UUID facultyId) {
        List<Assignment> assignments = assignmentRepository.findByFacultyId(facultyId);
        long pending = 0;
        for (Assignment a : assignments) {
            List<AssignmentSubmission> submissions = assignmentSubmissionRepository
                    .findByAssignmentIdOrderBySubmittedAtDesc(a.getId());
            pending += submissions.stream()
                    .filter(s -> s.getMarksAwarded() == null)
                    .count();
        }
        return pending;
    }

    private long countUpcomingFacultyQuizzes(UUID facultyId) {
        List<Quiz> quizzes = quizRepository.findByCreatedByIdAndIsDeletedFalse(facultyId);
        Instant now = Instant.now();
        return quizzes.stream()
                .filter(q -> q.getEndTime() != null && q.getEndTime().isAfter(now))
                .count();
    }

    private List<FacultyDashboardResponse.NoticeSummary> buildFacultyNotices(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getDepartment() == null) return Collections.emptyList();
        // Faculty sees general notices
        List<Notice> allNotices = noticeRepository.findAll();
        return allNotices.stream()
                .filter(n -> Boolean.TRUE.equals(n.getIsActive()) && !Boolean.TRUE.equals(n.getIsDeleted()))
                .filter(n -> n.getTargetRole() == null || n.getTargetRole() == UserRole.FACULTY)
                .sorted(Comparator.comparing(Notice::getPublishDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(n -> FacultyDashboardResponse.NoticeSummary.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .category(n.getCategory())
                        .priority(n.getPriority() != null ? n.getPriority().name() : null)
                        .publishDate(n.getPublishDate())
                        .build())
                .collect(Collectors.toList());
    }

    private List<FacultyDashboardResponse.NotificationSummary> buildFacultyNotifications(UUID userId) {
        List<UserNotification> notifications = userNotificationRepository.findByUserIdWithUser(userId);
        return notifications.stream()
                .limit(5)
                .map(n -> FacultyDashboardResponse.NotificationSummary.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private FacultyDashboardResponse.AcademicResourceSummary buildFacultyAcademicResources(UUID facultyId) {
        long lectureMaterials = lectureMaterialRepository.countByUploadedByIdAndIsDeletedFalse(facultyId);
        List<ClassSubject> subjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(facultyId);
        long schemes = 0;
        long syllabus = 0;
        for (ClassSubject cs : subjects) {
            schemes += subjectVersionRepository
                    .findBySubjectIdAndAcademicYearIdAndSemesterIdAndResourceTypeOrderByVersionNumberDesc(
                            cs.getSubject().getId(), cs.getAcademicYear().getId(), cs.getSemester().getId(), "SCHEME").size();
            syllabus += subjectVersionRepository
                    .findBySubjectIdAndAcademicYearIdAndSemesterIdAndResourceTypeOrderByVersionNumberDesc(
                            cs.getSubject().getId(), cs.getAcademicYear().getId(), cs.getSemester().getId(), "SYLLABUS").size();
        }
        // NOTE: timetables is not supported by the existing schema (stored as files, not quantifiable).
        return FacultyDashboardResponse.AcademicResourceSummary.builder()
                .lectureMaterials(lectureMaterials)
                .schemes(schemes)
                .syllabus(syllabus)
                .build();
    }

    // ======================== HOD DASHBOARD ========================

    @Override
    public HodDashboardResponse getHodDashboard(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UUID departmentId = user.getDepartment().getId();
        if (departmentId == null) {
            throw new RuntimeException("HOD is not assigned to any department");
        }

        long studentCount = userRepository.countByDepartmentIdAndRoleAndIsDeletedFalse(departmentId, UserRole.STUDENT);
        long facultyCount = userRepository.countByDepartmentIdAndRoleAndIsDeletedFalse(departmentId, UserRole.FACULTY);
        long attendanceCount = studentAttendanceRepository.countByDepartmentId(departmentId);
        long assignmentCount = assignmentRepository.countByDepartmentId(departmentId);
        long quizCount = quizRepository.countByDepartmentId(departmentId);
        long examCount = examinationRepository.countByDepartmentIdAndIsDeletedFalse(departmentId);
        long noticeCount = noticeRepository.countByTargetDepartmentIdAndIsDeletedFalseAndIsActiveTrue(departmentId);
        long notificationCount = userNotificationRepository.countByDepartmentId(departmentId);

        return HodDashboardResponse.builder()
                .departmentStudentCount(studentCount)
                .departmentFacultyCount(facultyCount)
                .attendanceRecordCount(attendanceCount)
                .assignmentCount(assignmentCount)
                .quizCount(quizCount)
                .examinationCount(examCount)
                .noticeCount(noticeCount)
                .notificationCount(notificationCount)
                .academicResources(buildHodAcademicResources(departmentId))
                .build();
    }

    private HodDashboardResponse.AcademicResourceSummary buildHodAcademicResources(UUID departmentId) {
        long lectureMaterials = lectureMaterialRepository.countByDepartmentId(departmentId);
        long schemes = subjectVersionRepository.countByDepartmentIdAndResourceType(departmentId, "SCHEME");
        long syllabus = subjectVersionRepository.countByDepartmentIdAndResourceType(departmentId, "SYLLABUS");
        return HodDashboardResponse.AcademicResourceSummary.builder()
                .totalSchemes(schemes)
                .totalSyllabus(syllabus)
                .totalLectureMaterials(lectureMaterials)
                .build();
    }

    // ======================== ADMIN DASHBOARD ========================

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        long totalStudents = userRepository.countByRoleAndIsDeletedFalse(UserRole.STUDENT);
        long totalFaculty = userRepository.countByRoleAndIsDeletedFalse(UserRole.FACULTY)
                + userRepository.countByRoleAndIsDeletedFalse(UserRole.HOD)
                + userRepository.countByRoleAndIsDeletedFalse(UserRole.COORDINATOR);
        long totalDepartments = departmentRepository.count();
        long totalClasses = acroClassRepository.count();
        long totalSubjects = subjectRepository.count();
        long totalAssignments = assignmentRepository.countByIsDeletedFalse();
        long totalQuizzes = quizRepository.countByIsDeletedFalse();
        long totalExaminations = examinationRepository.countByIsDeletedFalse();
        long totalNotices = noticeRepository.countByIsDeletedFalseAndIsActiveTrue();
        long totalNotifications = userNotificationRepository.count();
        long totalResources = lectureMaterialRepository.countByIsDeletedFalseAndIsActiveTrue()
                + subjectVersionRepository.count();

        return AdminDashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalFaculty(totalFaculty)
                .totalDepartments(totalDepartments)
                .totalClasses(totalClasses)
                .totalSubjects(totalSubjects)
                .totalAssignments(totalAssignments)
                .totalQuizzes(totalQuizzes)
                .totalExaminations(totalExaminations)
                .totalNotices(totalNotices)
                .totalNotifications(totalNotifications)
                .totalAcademicResources(totalResources)
                .build();
    }
}
