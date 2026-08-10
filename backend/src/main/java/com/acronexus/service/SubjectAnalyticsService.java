package com.acronexus.service;

import com.acronexus.dto.SubjectAnalyticsDTO;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectAnalyticsService {

    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public List<SubjectAnalyticsDTO> getSubjectAnalytics(UUID classSubjectId) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        
        UUID acroClassId = classSubject.getAcroClass().getId();
        
        // 1. Get all active students for the class
        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClassId);
        List<Student> students = enrollments.stream().map(StudentEnrollment::getStudent).collect(Collectors.toList());

        // 2. Fetch bulk data for this classSubject
        // Attendance
        List<StudentAttendance> attendances = studentAttendanceRepository.findByClassSubjectId(classSubjectId);
        int totalClassesConducted = (int) attendances.stream().map(StudentAttendance::getDate).distinct().count();
        
        // Assignments
        List<Assignment> assignments = assignmentRepository.findByClassSubjectId(classSubjectId);
        int totalAssignments = assignments.size();
        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignment_ClassSubject_Id(classSubjectId);
        
        // Quizzes
        List<Quiz> quizzes = quizRepository.findByClassSubject_IdAndIsDeletedFalseOrderByStartTimeDesc(classSubjectId);
        int totalQuizzes = quizzes.size();
        
        // Since quizAttemptRepository doesn't have findByQuiz_ClassSubject_Id, we get by quizIds
        List<UUID> quizIds = quizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        List<QuizAttempt> allQuizAttempts = new ArrayList<>();
        if (!quizIds.isEmpty()) {
            allQuizAttempts = quizAttemptRepository.findByQuiz_IdIn(quizIds);
        }

        // 3. Process each student
        List<SubjectAnalyticsDTO> results = new ArrayList<>();
        
        for (Student student : students) {
            UUID studentId = student.getUser().getId();
            SubjectAnalyticsDTO dto = new SubjectAnalyticsDTO();
            dto.setId(studentId);
            dto.setName(student.getUser().getFirstName() + " " + (student.getUser().getLastName() == null ? "" : student.getUser().getLastName()));
            dto.setEnrollmentNumber(student.getEnrollmentNo());
            dto.setEmail(student.getUser().getEmail());
            
            // Calculate Attendance
            long presentCount = attendances.stream()
                .filter(a -> a.getStudent().getId().equals(studentId))
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE)
                .count();
                
            int attendancePercentage = totalClassesConducted > 0 ? (int) Math.round((double) presentCount / totalClassesConducted * 100) : 0;
            
            SubjectAnalyticsDTO.AttendanceMetricsDTO attMetrics = new SubjectAnalyticsDTO.AttendanceMetricsDTO();
            attMetrics.setTotal(totalClassesConducted);
            attMetrics.setPresent((int) presentCount);
            attMetrics.setAbsent(totalClassesConducted - (int) presentCount);
            attMetrics.setPercentage(attendancePercentage);
            
            // Calculate Assignments
            long submittedCount = submissions.stream()
                .filter(s -> s.getStudent().getId().equals(studentId))
                .count();
                
            int assignmentPercentage = totalAssignments > 0 ? (int) Math.round((double) submittedCount / totalAssignments * 100) : 0;
            
            SubjectAnalyticsDTO.AssignmentMetricsDTO asnMetrics = new SubjectAnalyticsDTO.AssignmentMetricsDTO();
            asnMetrics.setTotal(totalAssignments);
            asnMetrics.setSubmitted((int) submittedCount);
            asnMetrics.setPending(totalAssignments - (int) submittedCount);
            asnMetrics.setPercentage(assignmentPercentage);
            
            // Calculate Quizzes
            List<QuizAttempt> studentAttempts = allQuizAttempts.stream()
                .filter(q -> q.getStudent().getId().equals(studentId))
                .collect(Collectors.toList());
                
            int attemptedCount = studentAttempts.size();
            double totalScore = studentAttempts.stream()
                .map(QuizAttempt::getScore)
                .filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
                
            double sumPercentage = 0;
            for (QuizAttempt attempt : studentAttempts) {
                double score = attempt.getScore() != null ? attempt.getScore().doubleValue() : 0;
                int totalQ = attempt.getQuiz().getTotalMarks() != null ? attempt.getQuiz().getTotalMarks().intValue() : 100;
                if(totalQ == 0) totalQ = 100; 
                double percentage = (score / totalQ) * 100;
                sumPercentage += percentage;
            }
            
            int quizAverage = attemptedCount > 0 ? (int) Math.round(sumPercentage / attemptedCount) : 0;
            
            SubjectAnalyticsDTO.QuizMetricsDTO quizMetrics = new SubjectAnalyticsDTO.QuizMetricsDTO();
            quizMetrics.setTotal(totalQuizzes);
            quizMetrics.setAttempted(attemptedCount);
            quizMetrics.setAverage(quizAverage);
            
            // Calculate Overall Score
            int overallScore = (int) Math.round((assignmentPercentage * 0.3) + (quizAverage * 0.4) + (attendancePercentage * 0.3));
            
            String badge;
            String badgeColor;
            String grade;
            String feedback;
            
            if (overallScore >= 90) {
                badge = "Excellent";
                badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                feedback = "Consistently performs well in assignments, quizzes and attendance. Keep up the excellent work.";
                grade = "O";
            } else if (overallScore >= 80) {
                badge = "Very Good";
                badgeColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
                feedback = "Strong academic performance with good attendance. Focus on improving quiz scores.";
                grade = "A+";
            } else if (overallScore >= 70) {
                badge = "Good";
                badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
                feedback = "Regular attendance and assignment submissions. More quiz practice is recommended.";
                grade = "A";
            } else if (overallScore >= 60) {
                badge = "Average";
                badgeColor = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
                feedback = "Performance is satisfactory but there is room for improvement in assignments and attendance.";
                grade = "B+";
            } else if (overallScore >= 50) {
                badge = "Needs Improvement";
                badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
                feedback = "Low attendance and incomplete assignments are affecting overall performance.";
                grade = "B";
            } else {
                badge = "Needs Improvement";
                badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
                feedback = "Immediate attention is recommended. Low attendance and poor performance.";
                grade = "C";
            }
            
            SubjectAnalyticsDTO.MetricsDTO metrics = new SubjectAnalyticsDTO.MetricsDTO();
            metrics.setAssignments(asnMetrics);
            metrics.setQuizzes(quizMetrics);
            metrics.setAttendance(attMetrics);
            metrics.setOverallScore(overallScore);
            metrics.setBadge(badge);
            metrics.setBadgeColor(badgeColor);
            metrics.setGrade(grade);
            metrics.setFeedback(feedback);
            
            dto.setMetrics(metrics);
            results.add(dto);
        }
        
        // Sort by overall score descending
        results.sort((a, b) -> Integer.compare(b.getMetrics().getOverallScore(), a.getMetrics().getOverallScore()));
        
        return results;
    }
}
