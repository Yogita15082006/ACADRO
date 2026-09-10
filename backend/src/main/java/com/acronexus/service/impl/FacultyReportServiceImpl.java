package com.acronexus.service.impl;

import com.acronexus.dto.FacultyReportDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.FacultyReportService;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.time.ZoneId;
import java.time.LocalDateTime;
import com.acronexus.service.UserService;
import com.acronexus.service.AttendanceSessionService;
import com.acronexus.dto.TeachingHistoryDTO;

@Service
@RequiredArgsConstructor
public class FacultyReportServiceImpl implements FacultyReportService {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final EventRepository eventRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;
    private final ExamCoordinatorAssignmentRepository examCoordinatorAssignmentRepository;
    private final FacultyManagementDelegationRepository facultyManagementDelegationRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final UserService userService;
    private final AttendanceSessionService attendanceSessionService;
    private final NoticeRepository noticeRepository;
    private final EventNoticeRepository eventNoticeRepository;
    private final ExaminationNoticeRepository examinationNoticeRepository;

    @Override
    @Transactional(readOnly = true)
    public FacultyReportDto getFacultyReport(UUID facultyId, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        User user = faculty.getUser();

        if (requester.getRole() == UserRole.HOD) {
            if (!userService.isFacultyInHodScope(user.getId(), requesterId)) {
                throw new UnauthorizedException("You are not authorized to view this faculty's report");
            }
        }

        List<TeachingHistoryDTO> teachingHistory = attendanceSessionService.getTeachingHistory(facultyId);

        return FacultyReportDto.builder()
                .profile(buildProfile(faculty, user))
                .responsibilities(buildResponsibilities(facultyId))
                .teachingHistory(teachingHistory)
                .teachingSummary(buildTeachingSummary(facultyId, teachingHistory))
                .teachingExceptions(buildTeachingExceptions(facultyId))
                .subjectAssignments(buildSubjectAssignments(facultyId))
                .events(buildEventActivity(facultyId))
                .notices(buildNotices(facultyId))
                .quizzes(buildQuizActivity(facultyId))
                .assignments(buildAssignmentActivity(facultyId))
                .examCoordinatorHistory(buildExamCoordinatorActivity(facultyId))
                .facultyManagementTaskHistory(buildDelegatedTaskHistory(facultyId))
                .recentActivity(buildRecentActivity(facultyId))
                .build();
    }

    private FacultyReportDto.Profile buildProfile(Faculty faculty, User user) {
        return FacultyReportDto.Profile.builder()
                .employeeId(faculty.getEmployeeId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .whatsappNumber(user.getWhatsappNumber())
                .personalEmail(user.getPersonalEmail())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .status(user.getIsActive() != null && user.getIsActive() ? "ACTIVE" : "INACTIVE")
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .additionalDepartments(faculty.getDepartments() != null ? 
                        faculty.getDepartments().stream().map(com.acronexus.entity.Department::getName).collect(java.util.stream.Collectors.toList()) : null)
                .designation(faculty.getDesignation())
                .qualification(faculty.getQualification())
                .experienceYears(faculty.getExperienceYears())
                .joiningDate(faculty.getJoiningDate())
                .expertiseAreas(faculty.getExpertiseAreas())
                .uploadedDocuments(user.getUploadedDocuments())
                .build();
    }

    private FacultyReportDto.Responsibilities buildResponsibilities(UUID facultyId) {
        List<String> currentRoles = new ArrayList<>();
        User user = userRepository.findById(facultyId).orElseThrow();
        currentRoles.add(user.getRole().name());

        List<CoordinatorAssignment> assignments = coordinatorAssignmentRepository.findByCoordinatorId(facultyId);
        List<String> classes = assignments.stream()
                .map(a -> a.getClassName() + " (" + a.getBatch() + ")")
                .collect(Collectors.toList());

        long activeTasks = facultyManagementDelegationRepository.findAll().stream()
                .filter(d -> d.getAssignedFaculty() != null && d.getAssignedFaculty().getId().equals(facultyId) && d.isActive())
                .count();

        return FacultyReportDto.Responsibilities.builder()
                .currentRoles(currentRoles)
                .coordinatorForClasses(classes)
                .activeDelegatedTasks((int) activeTasks)
                .build();
    }

    private FacultyReportDto.TeachingSummary buildTeachingSummary(UUID facultyId, List<TeachingHistoryDTO> teachingHistory) {
        long presentDays = attendanceSessionRepository.countDaysPresentByFacultyId(facultyId);
        long absentDays = facultyActivityRepository.countDaysAbsentByFacultyId(facultyId);
        long workingDays = presentDays + absentDays;

        long totalScheduled = teachingHistory.stream().mapToLong(TeachingHistoryDTO::getTotalScheduled).sum();
        long totalConducted = teachingHistory.stream().mapToLong(TeachingHistoryDTO::getConducted).sum();
        long totalMissed = teachingHistory.stream().mapToLong(TeachingHistoryDTO::getMissed).sum();
        long totalHoliday = 0; // Not available in TeachingHistoryDTO directly without adding it

        int overallAttendance = totalScheduled > 0 ? Math.round(((float) totalConducted / totalScheduled) * 100) : 0;

        return FacultyReportDto.TeachingSummary.builder()
                .totalWorkingDays(workingDays)
                .totalPresentDays(presentDays)
                .totalAbsentDays(absentDays)
                .totalClassesScheduled(totalScheduled)
                .totalClassesConducted(totalConducted)
                .totalClassesMissed(totalMissed)
                .totalHolidaySessions(totalHoliday)
                .overallAttendancePercentage(overallAttendance)
                .build();
    }

    private List<FacultyReportDto.TeachingExceptionRecord> buildTeachingExceptions(UUID facultyId) {
        return facultyActivityRepository.findByFacultyIdOrderByDateDesc(facultyId).stream()
                .filter(a -> a.getStatus() == FacultyActivityStatus.ABSENT || a.getStatus() == FacultyActivityStatus.CLASS_MISSED || a.getStatus() == FacultyActivityStatus.HOLIDAY)
                .map(a -> FacultyReportDto.TeachingExceptionRecord.builder()
                        .date(a.getDate())
                        .subjectName(a.getClassSubject() != null ? a.getClassSubject().getSubject().getName() : "-")
                        .className(a.getClassSubject() != null ? a.getClassSubject().getAcroClass().getName() : "-")
                        .status(a.getStatus().name())
                        .remark(a.getReason() != null ? a.getReason() : "-")
                        .build())
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.SubjectAssignment> buildSubjectAssignments(UUID facultyId) {
        return classSubjectRepository.findByFacultyIdAndIsActiveTrue(facultyId).stream()
                .map(cs -> FacultyReportDto.SubjectAssignment.builder()
                        .classSubjectId(cs.getId())
                        .subjectName(cs.getSubject().getName())
                        .subjectCode(cs.getSubject().getCode())
                        .className(cs.getAcroClass().getName())
                        .batchYear(cs.getAcroClass().getDegreeProgram() != null ? cs.getAcroClass().getDegreeProgram().getName() : "")
                        .semester(cs.getSemester() != null ? String.valueOf(cs.getSemester().getSemesterNumber()) : "")
                        .build())
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.EventActivity> buildEventActivity(UUID facultyId) {
        return eventRepository.findByCreatedBy_Id(facultyId).stream()
                .map(e -> {
                    String targetClasses = "";
                    if (e.getTargetAssignments() != null && !e.getTargetAssignments().isEmpty()) {
                        targetClasses = e.getTargetAssignments().stream()
                                .map(ta -> ta.getAcroClass() != null ? ta.getAcroClass().getName() : ta.getBatchYear())
                                .filter(Objects::nonNull)
                                .collect(Collectors.joining(", "));
                    }
                    return FacultyReportDto.EventActivity.builder()
                            .eventId(e.getId())
                            .eventName(e.getTitle())
                            .eventDate(e.getEventDate() != null ? e.getEventDate().toString() : "-")
                            .role("Creator")
                            .targetClasses(targetClasses.isEmpty() ? "-" : targetClasses)
                            .status(e.getIsActive() ? "ACTIVE" : "INACTIVE")
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.NoticeRecord> buildNotices(UUID facultyId) {
        List<FacultyReportDto.NoticeRecord> notices = new ArrayList<>();
        
        noticeRepository.findByPublishedBy_Id(facultyId).forEach(n -> {
            notices.add(FacultyReportDto.NoticeRecord.builder()
                    .noticeId(n.getId())
                    .title(n.getTitle())
                    .moduleType(n.getCategory() != null ? n.getCategory() : "General Notice")
                    .publishDate(n.getPublishDate() != null ? n.getPublishDate().toLocalDateTime() : null)
                    .status(n.getIsActive() ? "ACTIVE" : "INACTIVE")
                    .relatedEntity("-")
                    .build());
        });
        
        eventNoticeRepository.findByEvent_CreatedBy_Id(facultyId).forEach(en -> {
            notices.add(FacultyReportDto.NoticeRecord.builder()
                    .noticeId(en.getId())
                    .title(en.getTitle())
                    .moduleType("Event Notice")
                    .publishDate(en.getCreatedAt() != null ? en.getCreatedAt().toLocalDateTime() : null)
                    .status("ACTIVE")
                    .relatedEntity(en.getEvent() != null ? en.getEvent().getTitle() : "-")
                    .build());
        });
        
        
        notices.sort(Comparator.comparing(FacultyReportDto.NoticeRecord::getPublishDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return notices;
    }

    private List<FacultyReportDto.QuizActivity> buildQuizActivity(UUID facultyId) {
        return quizRepository.findByCreatedByIdAndIsDeletedFalse(facultyId).stream()
                .map(q -> FacultyReportDto.QuizActivity.builder()
                        .quizId(q.getId())
                        .title(q.getTitle())
                        .subjectName(q.getClassSubject() != null ? q.getClassSubject().getSubject().getName() : "")
                        .className(q.getClassSubject() != null ? q.getClassSubject().getAcroClass().getName() : "")
                        .startTime(q.getStartTime() != null ? q.getStartTime().atZone(ZoneId.systemDefault()).toLocalDateTime() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.AssignmentActivity> buildAssignmentActivity(UUID facultyId) {
        return assignmentRepository.findByFacultyId(facultyId).stream()
                .filter(a -> !a.getIsDeleted())
                .map(a -> {
                    long submissions = assignmentSubmissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(a.getId()).size();
                    return FacultyReportDto.AssignmentActivity.builder()
                            .assignmentId(a.getId())
                            .title(a.getTitle())
                            .subjectName(a.getClassSubject().getSubject().getName())
                            .className(a.getClassSubject().getAcroClass().getName())
                            .dueDate(a.getDeadline() != null ? a.getDeadline().toLocalDateTime() : null)
                            .submissionCount(submissions)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.ExamCoordinatorActivity> buildExamCoordinatorActivity(UUID facultyId) {
        return examCoordinatorAssignmentRepository.findAll().stream()
                .filter(e -> e.getAssignedUser() != null && e.getAssignedUser().getId().equals(facultyId))
                .map(e -> FacultyReportDto.ExamCoordinatorActivity.builder()
                        .assignmentId(e.getId())
                        .examPurpose(e.getExamPurpose())
                        .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : "")
                        .assignedAt(e.getCreatedAt() != null ? e.getCreatedAt().toLocalDateTime() : null)
                        .validUntil(e.getValidUntil() != null ? e.getValidUntil().atStartOfDay() : null)
                        .status(e.getIsActive() ? "ACTIVE" : "INACTIVE")
                        .completedAt(null)
                        .build())
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.DelegatedTask> buildDelegatedTaskHistory(UUID facultyId) {
        return facultyManagementDelegationRepository.findAll().stream()
                .filter(d -> d.getAssignedFaculty() != null && d.getAssignedFaculty().getId().equals(facultyId))
                .sorted(Comparator.comparing(FacultyManagementDelegation::getAssignedAt).reversed())
                .map(d -> FacultyReportDto.DelegatedTask.builder()
                        .delegationId(d.getId())
                        .taskPurpose(d.getTaskPurpose())
                        .assignedBy(d.getAssignedBy().getFirstName() + " " + d.getAssignedBy().getLastName())
                        .assignedAt(d.getAssignedAt())
                        .validUntil(d.getValidUntil())
                        .status(d.getStatus() != null ? d.getStatus().name() : "")
                        .completedAt(d.getCompletedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private List<FacultyReportDto.RecentActivity> buildRecentActivity(UUID facultyId) {
        List<FacultyReportDto.RecentActivity> activities = new ArrayList<>();
        
        attendanceSessionRepository.findByFacultyId(facultyId).stream()
                .sorted(Comparator.comparing(AttendanceSession::getCreatedAt).reversed())
                .limit(5)
                .forEach(s -> activities.add(FacultyReportDto.RecentActivity.builder()
                        .date(s.getCreatedAt() != null ? s.getCreatedAt().toLocalDateTime() : null)
                        .activityType("Conducted Class")
                        .module("Attendance")
                        .details(s.getClassSubject().getSubject().getName())
                        .build()));

        facultyManagementDelegationRepository.findAll().stream()
                .filter(d -> d.getAssignedFaculty() != null && d.getAssignedFaculty().getId().equals(facultyId))
                .sorted(Comparator.comparing(FacultyManagementDelegation::getAssignedAt).reversed())
                .limit(5)
                .forEach(d -> activities.add(FacultyReportDto.RecentActivity.builder()
                        .date(d.getAssignedAt())
                        .activityType("Assigned Task")
                        .module("Faculty Management")
                        .details(d.getTaskPurpose())
                        .build()));
                        
        eventRepository.findByCreatedBy_Id(facultyId).stream()
                .sorted(Comparator.comparing(Event::getCreatedAt).reversed())
                .limit(5)
                .forEach(e -> activities.add(FacultyReportDto.RecentActivity.builder()
                        .date(e.getCreatedAt() != null ? LocalDateTime.ofInstant(e.getCreatedAt(), ZoneId.systemDefault()) : null)
                        .activityType("Created Event")
                        .module("Events")
                        .details(e.getTitle())
                        .build()));
                        
        noticeRepository.findByPublishedBy_Id(facultyId).stream()
                .sorted(Comparator.comparing(Notice::getPublishDate).reversed())
                .limit(5)
                .forEach(n -> activities.add(FacultyReportDto.RecentActivity.builder()
                        .date(n.getPublishDate() != null ? n.getPublishDate().toLocalDateTime() : null)
                        .activityType("Published Notice")
                        .module("Notices")
                        .details(n.getTitle())
                        .build()));

        facultyActivityRepository.findByFacultyIdOrderByDateDesc(facultyId).stream()
                .filter(a -> a.getStatus() == FacultyActivityStatus.ABSENT || a.getStatus() == FacultyActivityStatus.CLASS_MISSED)
                .limit(5)
                .forEach(a -> activities.add(FacultyReportDto.RecentActivity.builder()
                        .date(a.getDate() != null ? a.getDate().atStartOfDay() : null)
                        .activityType("Teaching Exception")
                        .module("Attendance")
                        .details(a.getStatus().name() + " - " + (a.getClassSubject() != null ? a.getClassSubject().getSubject().getName() : ""))
                        .build()));

        activities.sort(Comparator.comparing(FacultyReportDto.RecentActivity::getDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return activities.stream().limit(10).collect(Collectors.toList());
    }

    @Override
    public com.acronexus.dto.FacultyConsolidatedReportDto getConsolidatedFacultyReport(UUID requesterId) {
        List<com.acronexus.dto.UserResponseDto> scopedUsers = userService.getFacultyForHodScope(requesterId);
        List<UUID> userIds = scopedUsers.stream().map(com.acronexus.dto.UserResponseDto::getId).collect(Collectors.toList());

        if (userIds.isEmpty()) {
            return com.acronexus.dto.FacultyConsolidatedReportDto.builder()
                    .generatedAt(java.time.LocalDateTime.now())
                    .totalFaculty(0)
                    .rows(new ArrayList<>())
                    .build();
        }

        List<Faculty> faculties = facultyRepository.findAllById(userIds);
        List<AttendanceSession> sessions = attendanceSessionRepository.findAll().stream().filter(a -> a.getFaculty() != null && userIds.contains(a.getFaculty().getId())).collect(Collectors.toList());
        List<FacultyActivity> activities = facultyActivityRepository.findAll().stream().filter(a -> a.getFaculty() != null && userIds.contains(a.getFaculty().getId())).collect(Collectors.toList());
        List<ClassSubject> classSubjects = classSubjectRepository.findAll().stream().filter(c -> c.getFaculty() != null && userIds.contains(c.getFaculty().getId()) && c.getIsActive()).collect(Collectors.toList());
        List<CoordinatorAssignment> coordinatorAssignments = coordinatorAssignmentRepository.findAll().stream().filter(c -> c.getCoordinator() != null && userIds.contains(c.getCoordinator().getId())).collect(Collectors.toList());
        List<Event> events = eventRepository.findAll().stream().filter(e -> e.getCreatedBy() != null && userIds.contains(e.getCreatedBy().getId())).collect(Collectors.toList());
        List<Notice> notices = noticeRepository.findAll().stream().filter(n -> n.getPublishedBy() != null && userIds.contains(n.getPublishedBy().getId())).collect(Collectors.toList());
        List<Quiz> quizzes = quizRepository.findAll().stream().filter(q -> q.getCreatedBy() != null && userIds.contains(q.getCreatedBy().getId()) && !q.getIsDeleted()).collect(Collectors.toList());
        List<Assignment> assignments = assignmentRepository.findAll().stream().filter(a -> a.getClassSubject() != null && a.getClassSubject().getFaculty() != null && userIds.contains(a.getClassSubject().getFaculty().getId())).collect(Collectors.toList());
        List<ExamCoordinatorAssignment> examTasks = examCoordinatorAssignmentRepository.findAll().stream().filter(e -> e.getAssignedUser() != null && userIds.contains(e.getAssignedUser().getId())).collect(Collectors.toList());
        List<com.acronexus.entity.FacultyManagementDelegation> assignedTasks = facultyManagementDelegationRepository.findAll().stream().filter(t -> t.getAssignedFaculty() != null && userIds.contains(t.getAssignedFaculty().getId())).collect(Collectors.toList());

        Map<UUID, Faculty> facultyMap = faculties.stream().collect(Collectors.toMap(f -> f.getUser().getId(), f -> f));
        Map<UUID, List<AttendanceSession>> sessionsMap = sessions.stream().collect(Collectors.groupingBy(a -> a.getFaculty().getId()));
        Map<UUID, List<FacultyActivity>> activitiesMap = activities.stream().collect(Collectors.groupingBy(a -> a.getFaculty().getId()));
        Map<UUID, List<ClassSubject>> csMap = classSubjects.stream().collect(Collectors.groupingBy(c -> c.getFaculty().getId()));
        Map<UUID, List<CoordinatorAssignment>> caMap = coordinatorAssignments.stream().collect(Collectors.groupingBy(c -> c.getCoordinator().getId()));
        Map<UUID, List<Event>> eventsMap = events.stream().collect(Collectors.groupingBy(e -> e.getCreatedBy().getId()));
        Map<UUID, List<Notice>> noticesMap = notices.stream().collect(Collectors.groupingBy(n -> n.getPublishedBy().getId()));
        Map<UUID, List<Quiz>> quizzesMap = quizzes.stream().collect(Collectors.groupingBy(q -> q.getCreatedBy().getId()));
        Map<UUID, List<Assignment>> assignmentsMap = assignments.stream().collect(Collectors.groupingBy(a -> a.getClassSubject().getFaculty().getId()));
        Map<UUID, List<ExamCoordinatorAssignment>> examTasksMap = examTasks.stream().collect(Collectors.groupingBy(e -> e.getAssignedUser().getId()));
        Map<UUID, List<com.acronexus.entity.FacultyManagementDelegation>> tasksMap = assignedTasks.stream().collect(Collectors.groupingBy(t -> t.getAssignedFaculty().getId()));

        List<com.acronexus.dto.FacultyReportRowDto> rows = new ArrayList<>();

        for (com.acronexus.dto.UserResponseDto userDto : scopedUsers) {
            UUID id = userDto.getId();
            Faculty f = facultyMap.get(id);
            if (f == null) continue;

            List<AttendanceSession> fSessions = sessionsMap.getOrDefault(id, new ArrayList<>());
            List<FacultyActivity> fActivities = activitiesMap.getOrDefault(id, new ArrayList<>());
            
            Map<UUID, List<AttendanceSession>> subjectSessions = fSessions.stream().collect(Collectors.groupingBy(s -> s.getClassSubject().getId()));
            long totalScheduled = 0;
            long totalConducted = 0;
            long totalMissed = fActivities.stream().filter(a -> a.getStatus() == com.acronexus.entity.FacultyActivityStatus.CLASS_MISSED).count();
            long totalHoliday = fActivities.stream().filter(a -> a.getStatus() == com.acronexus.entity.FacultyActivityStatus.HOLIDAY).count();
            
            for (Map.Entry<UUID, List<AttendanceSession>> entry : subjectSessions.entrySet()) {
                totalScheduled += entry.getValue().size();
                totalConducted += entry.getValue().stream().filter(s -> s.getStatus() == com.acronexus.entity.AttendanceSessionStatus.COMPLETED || s.getStatus() == com.acronexus.entity.AttendanceSessionStatus.SAVED || s.getStatus() == com.acronexus.entity.AttendanceSessionStatus.CLOSED).count();
            }
            
            int overallAttendance = totalScheduled > 0 ? Math.round(((float) totalConducted / totalScheduled) * 100) : 0;

            List<ClassSubject> fCs = csMap.getOrDefault(id, new ArrayList<>());
            String assignedClassesStr = fCs.stream().map(c -> c.getAcroClass().getName()).distinct().collect(Collectors.joining(", "));
            String assignedSubjectsStr = fCs.stream().map(c -> c.getSubject().getName()).distinct().collect(Collectors.joining(", "));
            String academicYearsStr = fCs.stream().map(c -> c.getAcroClass().getDegreeProgram() != null ? c.getAcroClass().getDegreeProgram().getName() : "").filter(s -> !s.isEmpty()).distinct().collect(Collectors.joining(", "));
            String semestersStr = fCs.stream().map(c -> c.getSemester() != null ? String.valueOf(c.getSemester().getSemesterNumber()) : "").filter(s -> !s.isEmpty()).distinct().collect(Collectors.joining(", "));

            String coordStr = caMap.getOrDefault(id, new ArrayList<>()).stream()
                    .map(c -> (c.getClassName() != null ? c.getClassName() : "") + " " + (c.getBatch() != null ? c.getBatch() : ""))
                    .filter(s -> !s.trim().isEmpty())
                    .collect(Collectors.joining(", "));

            String departmentsStr = f.getDepartments() != null ? f.getDepartments().stream().map(com.acronexus.entity.Department::getName).collect(Collectors.joining(", ")) : "";

            rows.add(com.acronexus.dto.FacultyReportRowDto.builder()
                    .userId(id)
                    .employeeId(f.getEmployeeId())
                    .facultyName(userDto.getFirstName() + " " + userDto.getLastName())
                    .department(userDto.getDepartment() != null ? userDto.getDepartment().getName() : "-")
                    .additionalDepartments(departmentsStr)
                    .designation(f.getDesignation() != null ? f.getDesignation() : "-")
                    .qualification(f.getQualification() != null ? f.getQualification() : "-")
                    .specialization(f.getExpertiseAreas() != null ? String.join(", ", f.getExpertiseAreas()) : "-")
                    .experience(f.getExperienceYears() != null ? f.getExperienceYears() + " years" : "-")
                    .joiningDate(f.getJoiningDate())
                    .officialEmail(userDto.getEmail())
                    .phone(userDto.getPhone())
                    .whatsappNumber(userDto.getPhone()) // whatsappNumber missing in DTO, fallback to phone
                    .coordinatorResponsibility(coordStr.isEmpty() ? "-" : coordStr)
                    .assignedClasses(assignedClassesStr.isEmpty() ? "-" : assignedClassesStr)
                    .academicYears(academicYearsStr.isEmpty() ? "-" : academicYearsStr)
                    .semesters(semestersStr.isEmpty() ? "-" : semestersStr)
                    .assignedSubjects(assignedSubjectsStr.isEmpty() ? "-" : assignedSubjectsStr)
                    .overallAttendance(overallAttendance)
                    .classesScheduled(totalScheduled)
                    .classesConducted(totalConducted)
                    .classesMissed(totalMissed)
                    .holidaySessions(totalHoliday)
                    .eventsCreated(eventsMap.getOrDefault(id, new ArrayList<>()).size())
                    .noticesPublished(noticesMap.getOrDefault(id, new ArrayList<>()).size())
                    .quizzesCreated(quizzesMap.getOrDefault(id, new ArrayList<>()).size())
                    .assignmentsCreated(assignmentsMap.getOrDefault(id, new ArrayList<>()).size())
                    .examinationActivities(examTasksMap.getOrDefault(id, new ArrayList<>()).size())
                    .examCoordinatorAssignments(examTasksMap.getOrDefault(id, new ArrayList<>()).size())
                    .facultyManagementAssignedTasks(tasksMap.getOrDefault(id, new ArrayList<>()).size())
                    .build());
        }

        return com.acronexus.dto.FacultyConsolidatedReportDto.builder()
                .generatedAt(java.time.LocalDateTime.now())
                .totalFaculty(rows.size())
                .rows(rows)
                .build();
    }
}
