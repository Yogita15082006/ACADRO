package com.acronexus.service.impl;

import com.acronexus.dto.response.AdminDashboardResponse;
import com.acronexus.dto.response.FacultyDashboardResponse;
import com.acronexus.dto.response.HodDashboardResponse;
import com.acronexus.dto.response.StudentDashboardResponse;
import com.acronexus.dto.response.CoordinatorDashboardResponse;
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
    private final EventAttendanceRecordRepository eventAttendanceRecordRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final FacultyRepository facultyRepository;
    private final AcademicSchemeRepository academicSchemeRepository;
    private final AcademicSyllabusRepository academicSyllabusRepository;
    private final TimetableRepository timetableRepository;
    private final com.acronexus.service.AttendanceDashboardService attendanceDashboardService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

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

        UUID classId = enrollment.getAcroClass() != null ? enrollment.getAcroClass().getId() : null;
        UUID departmentId = user.getDepartment() != null 
                ? user.getDepartment().getId() 
                : (enrollment.getAcroClass() != null && enrollment.getAcroClass().getDepartment() != null 
                        ? enrollment.getAcroClass().getDepartment().getId() 
                        : null);
        UUID semesterId = enrollment.getSemester() != null ? enrollment.getSemester().getId() : null;
        UUID academicYearId = enrollment.getAcademicYear() != null ? enrollment.getAcademicYear().getId() : null;
        String batchYear = student.getBatchYear();

        return StudentDashboardResponse.builder()
                .attendanceOverview(buildAttendanceOverview(student.getId(), academicYearId, semesterId))
                .subjectAttendance(buildSubjectAttendance(student.getId(), academicYearId, semesterId))
                .upcomingAssignments(buildUpcomingAssignments(student.getId(), userId))
                .pendingAssignments(buildPendingAssignments(student.getId(), userId))
                .upcomingQuizzes(buildUpcomingQuizzes(student.getId(), userId))
                .recentQuizScores(buildRecentQuizScores(userId))
                .upcomingExams(buildUpcomingExams(classId, academicYearId, semesterId, departmentId))
                .latestNotices(buildStudentNotices(classId, batchYear))
                .latestNotifications(buildNotifications(userId))
                .academicResources(buildStudentAcademicResources(classId))
                .build();
    }

    private StudentDashboardResponse.AttendanceOverview buildAttendanceOverview(UUID studentId, UUID academicYearId, UUID semesterId) {
        com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto overall = attendanceDashboardService.getStudentOverallAttendance(studentId, academicYearId, semesterId);
        return StudentDashboardResponse.AttendanceOverview.builder()
                .totalClasses(overall.getTotalClasses() != null ? overall.getTotalClasses() : 0)
                .classesAttended(overall.getTotalPresent() != null ? overall.getTotalPresent() : 0)
                .attendancePercentage(overall.getOverallPercentage() != null ? Math.round(overall.getOverallPercentage() * 100.0) / 100.0 : 0.0)
                .build();
    }

    private List<StudentDashboardResponse.SubjectAttendance> buildSubjectAttendance(UUID studentId, UUID academicYearId, UUID semesterId) {
        List<Object[]> results = studentAttendanceRepository.getSubjectWiseAttendance(studentId, academicYearId, semesterId);
        return results.stream().map(row -> {
            String subjectName = (String) row[0];
            long total = row[3] != null ? ((Number) row[3]).longValue() : 0;
            long attended = row[4] != null ? ((Number) row[4]).longValue() : 0;
            long missed = row[5] != null ? ((Number) row[5]).longValue() : 0;
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
        if (classId == null || academicYearId == null || semesterId == null || departmentId == null) {
            return Collections.emptyList();
        }
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

    private List<StudentDashboardResponse.NoticeSummary> buildStudentNotices(UUID classId, String batchYear) {
        if (classId == null) {
            return Collections.emptyList();
        }
        List<Notice> notices = noticeRepository.findStudentFeed(classId, batchYear);
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
        if (classId == null) {
            return StudentDashboardResponse.AcademicResourceSummary.builder()
                    .lectureMaterialCount(0)
                    .schemeCount(0)
                    .syllabusCount(0)
                    .timetableCount(0L)
                    .build();
        }
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
        // Populate Subject Metrics
        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(userId);
        List<FacultyDashboardResponse.SubjectMetrics> subjectMetrics = new ArrayList<>();
        long totalSubmitted = 0;
        long totalLate = 0;
        long totalMissing = 0;

        for (ClassSubject cs : classSubjects) {
            String className = cs.getAcroClass().getName();
            String subjectName = cs.getSubject().getName();
            Double attendancePercentage = 0.0;
            long pendingSubjectAssignments = 0;

            Object classAtt = studentAttendanceRepository.getClassAttendanceSummary(cs.getId());
            if (classAtt != null) {
                if (classAtt instanceof Object[] row) {
                    long tP = row.length > 3 && row[3] != null ? ((Number) row[3]).longValue() : 0;
                    long tA = row.length > 4 && row[4] != null ? ((Number) row[4]).longValue() : 0;
                    long totalClassTotal = tP + tA;
                    if (totalClassTotal > 0) {
                        attendancePercentage = Math.round((tP * 10000.0) / totalClassTotal) / 100.0;
                    }
                } else if (classAtt instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Object[] row) {
                    long tP = row.length > 3 && row[3] != null ? ((Number) row[3]).longValue() : 0;
                    long tA = row.length > 4 && row[4] != null ? ((Number) row[4]).longValue() : 0;
                    long totalClassTotal = tP + tA;
                    if (totalClassTotal > 0) {
                        attendancePercentage = Math.round((tP * 10000.0) / totalClassTotal) / 100.0;
                    }
                }
            }

            // Mocking quiz average as we don't have direct DB access to specific quiz score average per class
            Double quizAverage = 0.0;

            subjectMetrics.add(FacultyDashboardResponse.SubjectMetrics.builder()
                    .className(className)
                    .subjectName(subjectName)
                    .attendancePercentage(attendancePercentage)
                    .pendingAssignments(pendingSubjectAssignments)
                    .quizAverage(quizAverage)
                    .build());
        }

        // Mocking Quiz Performance for charts
        List<FacultyDashboardResponse.QuizPerformance> quizPerformance = new ArrayList<>();

        FacultyDashboardResponse.AssignmentSubmissionStats assignmentStats = FacultyDashboardResponse.AssignmentSubmissionStats.builder()
                .submitted(0).late(0).missing(0).build();

        return FacultyDashboardResponse.builder()
                .totalAssignedSubjects(totalSubjects)
                .totalClasses(totalClasses)
                .pendingEvaluations(pendingEvaluations)
                .upcomingQuizCount(countUpcomingFacultyQuizzes(userId))
                .lectureMaterialCount(lectureMaterials)
                .recentNotices(buildFacultyNotices(userId))
                .recentNotifications(buildFacultyNotifications(userId))
                .academicResources(buildFacultyAcademicResources(userId))
                .subjectMetrics(subjectMetrics)
                .quizPerformance(quizPerformance)
                .assignmentStats(assignmentStats)
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
        long examinationCount = examinationRepository.countByDepartmentIdAndIsDeletedFalse(departmentId);
        long noticeCount = noticeRepository.countByTargetDepartmentIdAndIsDeletedFalseAndIsActiveTrue(departmentId);
        long notificationCount = userNotificationRepository.countByDepartmentId(departmentId);
        long classCount = acroClassRepository.countByDepartmentId(departmentId);
        String deptName = user.getDepartment().getName();

        Object attendanceResult = studentAttendanceRepository.getDepartmentOverallAttendance(departmentId);
        Double attendancePercentage = null;
        if (attendanceResult != null) {
            long totalClasses = 0;
            long presentClasses = 0;
            if (attendanceResult instanceof Object[] row) {
                totalClasses = row.length > 0 && row[0] != null ? ((Number) row[0]).longValue() : 0;
                presentClasses = row.length > 1 && row[1] != null ? ((Number) row[1]).longValue() : 0;
            } else if (attendanceResult instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Object[] row) {
                totalClasses = row.length > 0 && row[0] != null ? ((Number) row[0]).longValue() : 0;
                presentClasses = row.length > 1 && row[1] != null ? ((Number) row[1]).longValue() : 0;
            }
            if (totalClasses > 0) {
                attendancePercentage = Math.round(((double) presentClasses / totalClasses) * 10000.0) / 100.0;
            } else {
                attendancePercentage = 0.0;
            }
        }

        Faculty faculty = facultyRepository.findById(userId).orElse(null);
        List<com.acronexus.entity.Department> targetDepts = new ArrayList<>();
        if (faculty != null && faculty.getDepartments() != null && !faculty.getDepartments().isEmpty()) {
            targetDepts = faculty.getDepartments();
        } else if (user.getDepartment() != null) {
            targetDepts.add(user.getDepartment());
        }

        if (targetDepts.isEmpty()) {
            throw new RuntimeException("HOD is not assigned to any department");
        }

        List<HodDashboardResponse.DepartmentStats> breakdowns = new ArrayList<>();
        
        long totalStudentCount = 0;
        long totalFacultyCount = 0;
        long totalClassCount = 0;
        long totalAttendanceCount = 0;
        long totalAssignmentCount = 0;
        long totalQuizCount = 0;
        long totalExaminationCount = 0;
        long totalNoticeCount = 0;
        long totalNotificationCount = 0;
        long globalTotalClassesHeld = 0;
        long globalTotalPresent = 0;

        long totalSchemes = 0;
        long totalSyllabus = 0;
        long totalLectureMaterials = 0;

        for (com.acronexus.entity.Department subDept : targetDepts) {
            UUID subId = subDept.getId();
            String subDeptName = subDept.getName();
            
            long sc = userRepository.countByDepartmentIdAndRoleAndIsDeletedFalse(subId, UserRole.STUDENT);
            long fc = userRepository.countByDepartmentIdAndRoleAndIsDeletedFalse(subId, UserRole.FACULTY);
            long cc = acroClassRepository.countByDepartmentId(subId);
            
            totalStudentCount += sc;
            totalFacultyCount += fc;
            totalClassCount += cc;
            totalAttendanceCount += studentAttendanceRepository.countByDepartmentId(subId);
            totalAssignmentCount += assignmentRepository.countByDepartmentId(subId);
            totalQuizCount += quizRepository.countByDepartmentId(subId);
            totalExaminationCount += examinationRepository.countByDepartmentIdAndIsDeletedFalse(subId);
            totalNoticeCount += noticeRepository.countByTargetDepartmentIdAndIsDeletedFalseAndIsActiveTrue(subId);
            totalNotificationCount += userNotificationRepository.countByDepartmentId(subId);
            
            totalSchemes += academicSchemeRepository.countByDepartmentIgnoreCase(subDeptName);
            totalSyllabus += academicSyllabusRepository.countByDepartmentIgnoreCase(subDeptName);
            totalLectureMaterials += timetableRepository.countByAcroClassDepartmentId(subId);

            Double attPct = 0.0;
            Object attRes = studentAttendanceRepository.getDepartmentOverallAttendance(subId);
            if (attRes != null) {
                long t = 0, p = 0;
                if (attRes instanceof Object[] row) {
                    t = row.length > 0 && row[0] != null ? ((Number) row[0]).longValue() : 0;
                    p = row.length > 1 && row[1] != null ? ((Number) row[1]).longValue() : 0;
                } else if (attRes instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Object[] row) {
                    t = row.length > 0 && row[0] != null ? ((Number) row[0]).longValue() : 0;
                    p = row.length > 1 && row[1] != null ? ((Number) row[1]).longValue() : 0;
                }
                globalTotalClassesHeld += t;
                globalTotalPresent += p;
                if (t > 0) {
                    attPct = Math.round(((double) p / t) * 10000.0) / 100.0;
                }
            }
            
            breakdowns.add(HodDashboardResponse.DepartmentStats.builder()
                    .name(subDeptName)
                    .studentCount(sc)
                    .facultyCount(fc)
                    .classCount(cc)
                    .attendancePercentage(attPct)
                    .build());
        }

        if (globalTotalClassesHeld > 0) {
            attendancePercentage = Math.round(((double) globalTotalPresent / globalTotalClassesHeld) * 10000.0) / 100.0;
        } else {
            attendancePercentage = 0.0;
        }

        String deptNameStr = targetDepts.stream().map(com.acronexus.entity.Department::getName).collect(Collectors.joining(" • "));

        return HodDashboardResponse.builder()
                .departmentName(deptNameStr)
                .departmentStudentCount(totalStudentCount)
                .departmentFacultyCount(totalFacultyCount)
                .departmentClassCount(totalClassCount)
                .attendanceRecordCount(totalAttendanceCount)
                .assignmentCount(totalAssignmentCount)
                .quizCount(totalQuizCount)
                .examinationCount(totalExaminationCount)
                .noticeCount(totalNoticeCount)
                .notificationCount(totalNotificationCount)
                .departmentAttendancePercentage(attendancePercentage)
                .departmentBreakdowns(breakdowns)
                .academicResources(HodDashboardResponse.AcademicResourceSummary.builder()
                        .totalSchemes(totalSchemes)
                        .totalSyllabus(totalSyllabus)
                        .totalLectureMaterials(totalLectureMaterials)
                        .build())
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

    // ======================== COORDINATOR DASHBOARD ========================

    @Override
    public CoordinatorDashboardResponse getCoordinatorDashboard(UUID userId) {
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        List<CoordinatorAssignment> assignments = coordinatorAssignmentRepository.findByCoordinatorId(userId);
        long totalClasses = assignments.size();
        long totalStudents = 0;
        long totalSubjects = 0;
        long upcomingEvents = 0;
        long activeNotices = 0;
        long pendingAcademicActivities = 0;
        long totalEligible = 0;
        long totalDefaulters = 0;

        List<CoordinatorDashboardResponse.ClassOverview> classOverviews = new ArrayList<>();

        for (CoordinatorAssignment assignment : assignments) {
            String className = assignment.getClassName();
            AcroClass acroClass = acroClassRepository.findByName(className).stream().findFirst().orElse(null);
            
            long classStudentCount = 0;
            Double classAttendance = 0.0;
            long eligible = 0;
            long defaulters = 0;

            if (acroClass != null) {
                // Strictly filter students based on Coordinator Assignment directly from Student table
                List<Student> matchedStudents = studentRepository.findByStrictCoordinatorScope(
                        assignment.getCoordinator().getDepartment().getId(),
                        assignment.getBatch(),
                        assignment.getSemester() != null ? assignment.getSemester().replace("Semester ", "") : null,
                        assignment.getClassName()
                );
                
                classStudentCount = matchedStudents.size();
                totalStudents += classStudentCount;
                
                // Strictly filter subjects based on Coordinator Assignment
                List<ClassSubject> classSubjects = classSubjectRepository.findByAcroClassIdAndIsActiveTrue(acroClass.getId());
                classSubjects = classSubjects.stream().filter(cs -> {
                    // Department Match
                    if (assignment.getCoordinator() != null && assignment.getCoordinator().getDepartment() != null
                        && cs.getAcroClass() != null && cs.getAcroClass().getDepartment() != null) {
                        if (!assignment.getCoordinator().getDepartment().getId().equals(cs.getAcroClass().getDepartment().getId())) {
                            return false; // Department must strictly match
                        }
                    } else {
                        return false;
                    }
                    
                    if (assignment.getAcademicYear() != null) {
                        if (cs.getAcademicYear() == null || !assignment.getAcademicYear().equalsIgnoreCase(cs.getAcademicYear().getYear())) return false;
                    }
                    
                    if (assignment.getSemester() != null) {
                        if (cs.getSemester() == null) return false;
                        String semName = "Semester " + cs.getSemester().getSemesterNumber();
                        if (!assignment.getSemester().equalsIgnoreCase(semName)) return false;
                    }
                    
                    return true;
                }).collect(Collectors.toList());
                totalSubjects += classSubjects.size();
                
                long totalPresent = 0;
                long totalClassTotal = 0;
                
                UUID academicYearId = null;
                UUID semesterId = null;
                if (!classSubjects.isEmpty()) {
                    if (classSubjects.get(0).getAcademicYear() != null) academicYearId = classSubjects.get(0).getAcademicYear().getId();
                    if (classSubjects.get(0).getSemester() != null) semesterId = classSubjects.get(0).getSemester().getId();
                }
                
                List<UUID> studentIds = matchedStudents.stream().map(Student::getId).collect(Collectors.toList());
                java.util.Map<UUID, com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto> bulkAtt = attendanceDashboardService.getStudentOverallAttendanceInBulk(studentIds, academicYearId, semesterId);
                
                for (Student student : matchedStudents) {
                    com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto dto = bulkAtt.get(student.getId());
                    if (dto != null) {
                        long t = dto.getTotalClasses() != null ? dto.getTotalClasses() : 0;
                        long p = dto.getTotalPresent() != null ? dto.getTotalPresent() : 0;
                        totalPresent += p;
                        totalClassTotal += t;
                        
                        double studentPct = t > 0 ? (p * 100.0 / t) : 0;
                        if (studentPct >= 75.0) {
                            eligible++;
                            totalEligible++;
                        } else {
                            defaulters++;
                            totalDefaulters++;
                        }
                    } else {
                        defaulters++; // If no attendance data, consider as defaulter (0%)
                        totalDefaulters++;
                    }
                }
                
                if (totalClassTotal > 0) {
                    classAttendance = Math.round((totalPresent * 10000.0) / totalClassTotal) / 100.0;
                }
            }
            
            classOverviews.add(CoordinatorDashboardResponse.ClassOverview.builder()
                    .className(className)
                    .studentCount(classStudentCount)
                    .attendancePercentage(classAttendance)
                    .eligibleStudents(eligible)
                    .defaulterStudents(defaulters)
                    .build());
        }

        return CoordinatorDashboardResponse.builder()
                .totalClasses(totalClasses)
                .totalStudents(totalStudents)
                .totalSubjects(totalSubjects)
                .upcomingEvents(upcomingEvents)
                .activeNotices(activeNotices)
                .pendingAcademicActivities(pendingAcademicActivities)
                .classOverview(classOverviews)
                .eligibilityStats(CoordinatorDashboardResponse.EligibilityStats.builder()
                        .totalEligible(totalEligible)
                        .totalDefaulters(totalDefaulters)
                        .build())
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
