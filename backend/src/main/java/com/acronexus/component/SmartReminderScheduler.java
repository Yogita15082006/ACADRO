package com.acronexus.component;

import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SmartReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SmartReminderScheduler.class);
    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    private final NotificationService notificationService;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ExaminationRepository examinationRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;

    @Scheduled(cron = "0 0/10 * * * ?", zone = "Asia/Kolkata")
    public void processReminders() {
        logger.info("Starting smart reminder scheduler...");
        try {
            processAssignmentReminders();
            processQuizReminders();
            processExaminationReminders();
            processEventReminders();
        } catch (Exception e) {
            logger.error("Error running smart reminder scheduler", e);
        }
        logger.info("Completed smart reminder scheduler.");
    }

    private void processAssignmentReminders() {
        ZonedDateTime now = ZonedDateTime.now(IST_ZONE);
        ZonedDateTime windowEnd = now.plusHours(24);

        List<Assignment> upcomingAssignments = assignmentRepository.findByIsDeletedFalseAndDeadlineBetween(now, windowEnd);

        for (Assignment assignment : upcomingAssignments) {
            if (assignment.getClassSubject() == null || assignment.getClassSubject().getAcroClass() == null) continue;

            boolean isOneHour = ChronoUnit.HOURS.between(now, assignment.getDeadline()) <= 1;
            String timeStr = isOneHour ? "1 hour" : "24 hours";
            String refSuffix = isOneHour ? "1h" : "24h";
            String referenceId = "assignment:" + assignment.getId() + ":deadline:" + refSuffix;

            List<StudentEnrollment> enrolledStudents = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(assignment.getClassSubject().getAcroClass().getId());
            
            for (StudentEnrollment enrollment : enrolledStudents) {
                boolean hasSubmitted = assignmentSubmissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), enrollment.getStudent().getId()).isPresent();
                
                if (!hasSubmitted) {
                    notificationService.createSystemNotification(
                            enrollment.getStudent().getUser().getId(),
                            "Assignment Deadline Approaching",
                            "Your assignment \"" + assignment.getTitle() + "\" is due in " + timeStr + ".",
                            "ASSIGNMENT",
                            referenceId
                    );
                }
            }
        }
    }

    private void processQuizReminders() {
        Instant now = Instant.now();
        Instant windowEnd = now.plus(24, ChronoUnit.HOURS);

        List<Quiz> upcomingQuizzes = quizRepository.findByIsDeletedFalseAndEndTimeBetween(now, windowEnd);

        for (Quiz quiz : upcomingQuizzes) {
            // Only remind if quiz has already started
            if (quiz.getStartTime().isAfter(now)) continue;

            if (quiz.getClassSubject() == null || quiz.getClassSubject().getAcroClass() == null) continue;

            boolean isOneHour = ChronoUnit.HOURS.between(now, quiz.getEndTime()) <= 1;
            String timeStr = isOneHour ? "1 hour" : "24 hours";
            String refSuffix = isOneHour ? "1h" : "24h";
            String referenceId = "quiz:" + quiz.getId() + ":reminder:" + refSuffix;

            List<StudentEnrollment> enrolledStudents = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(quiz.getClassSubject().getAcroClass().getId());
            
            for (StudentEnrollment enrollment : enrolledStudents) {
                boolean hasAttempted = quizAttemptRepository.existsByQuiz_IdAndStudent_User_Id(quiz.getId(), enrollment.getStudent().getUser().getId());
                
                if (!hasAttempted) {
                    notificationService.createSystemNotification(
                            enrollment.getStudent().getUser().getId(),
                            "Quiz Reminder",
                            "You have not attempted the quiz \"" + quiz.getTitle() + "\" yet. It closes in " + timeStr + ".",
                            "QUIZ",
                            referenceId
                    );
                }
            }
        }
    }

    private void processExaminationReminders() {
        LocalDate tomorrow = LocalDate.now(IST_ZONE).plusDays(1);
        
        List<Examination> upcomingExams = examinationRepository.findByIsDeletedFalseAndStatusInAndStartDate(
                List.of(ExamStatus.UPCOMING, ExamStatus.ACTIVE), tomorrow);

        for (Examination exam : upcomingExams) {
            String referenceId = "examination:" + exam.getId() + ":reminder:24h";
            
            for (AcroClass acroClass : exam.getClasses()) {
                List<StudentEnrollment> enrolledStudents = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClass.getId());
                
                for (StudentEnrollment enrollment : enrolledStudents) {
                    notificationService.createSystemNotification(
                            enrollment.getStudent().getUser().getId(),
                            "Examination Reminder",
                            "Your examination \"" + exam.getName() + "\" is scheduled for tomorrow.",
                            "EXAMINATION",
                            referenceId
                    );
                }
            }
        }
    }

    private void processEventReminders() {
        Instant now = Instant.now();
        Instant windowEnd = now.plus(24, ChronoUnit.HOURS);

        // 1. Registration Deadlines
        List<Event> regEndingEvents = eventRepository.findByIsActiveTrueAndRegistrationEndBetween(now, windowEnd);
        for (Event event : regEndingEvents) {
            String referenceId = "event:" + event.getId() + ":registration:24h";
            notifyTargetedStudentsForEvent(event, "Event Registration Approaching", "Registration for event \"" + event.getTitle() + "\" closes in 24 hours.", "EVENT", referenceId, true);
        }

        // 2. Event Starting
        List<Event> startingEvents = eventRepository.findByIsActiveTrueAndEventDateBetween(now, windowEnd);
        for (Event event : startingEvents) {
            String referenceId = "event:" + event.getId() + ":start:24h";
            notifyTargetedStudentsForEvent(event, "Event Starting Soon", "The event \"" + event.getTitle() + "\" is starting within 24 hours.", "EVENT", referenceId, false);
        }
    }

    private void notifyTargetedStudentsForEvent(Event event, String title, String message, String type, String referenceId, boolean checkRegistration) {
        if (event.getTargetClass() != null) {
            notifyClassForEvent(event.getTargetClass().getId(), event, title, message, type, referenceId, checkRegistration);
        }
        if (event.getTargetAssignments() != null) {
            for (EventTargetAssignment assignment : event.getTargetAssignments()) {
                if (assignment.getAcroClass() != null) {
                    notifyClassForEvent(assignment.getAcroClass().getId(), event, title, message, type, referenceId, checkRegistration);
                }
            }
        }
    }

    private void notifyClassForEvent(java.util.UUID classId, Event event, String title, String message, String type, String referenceId, boolean checkRegistration) {
        List<StudentEnrollment> enrolledStudents = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classId);
        for (StudentEnrollment enrollment : enrolledStudents) {
            if (checkRegistration && event.getRegistrationEnd() != null) {
                boolean hasRegistered = eventRegistrationRepository.existsByEventIdAndStudentUserId(event.getId(), enrollment.getStudent().getUser().getId());
                if (hasRegistered) continue; // Already registered, skip reminder
            }
            notificationService.createSystemNotification(
                    enrollment.getStudent().getUser().getId(),
                    title,
                    message,
                    type,
                    referenceId
            );
        }
    }
}
