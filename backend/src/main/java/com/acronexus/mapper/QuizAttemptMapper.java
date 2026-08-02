package com.acronexus.mapper;

import com.acronexus.dto.QuizAttemptDto;
import com.acronexus.entity.QuizAttempt;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class QuizAttemptMapper {

    public QuizAttemptDto.Response toResponseDto(QuizAttempt entity) {
        if (entity == null) return null;

        com.acronexus.entity.Quiz quiz = entity.getQuiz();
        com.acronexus.entity.Student student = entity.getStudent();
        com.acronexus.entity.User user = (student != null) ? student.getUser() : null;

        String studentName = "Student";
        String profilePictureUrl = null;
        if (user != null) {
            String fname = user.getFirstName() != null ? user.getFirstName() : "";
            String lname = user.getLastName() != null ? user.getLastName() : "";
            String full = (fname + " " + lname).trim();
            if (!full.isEmpty()) studentName = full;
            profilePictureUrl = user.getProfilePictureUrl();
        }
        String avatarUrl = (profilePictureUrl != null && !profilePictureUrl.trim().isEmpty()) ? profilePictureUrl : "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(studentName, java.nio.charset.StandardCharsets.UTF_8) + "&background=4F46E5&color=fff";

        Integer totalMarks = (quiz != null && quiz.getTotalMarks() != null) ? quiz.getTotalMarks() : 100;

        BigDecimal percentage = entity.getPercentage();
        if (percentage == null && entity.getScore() != null && totalMarks > 0) {
            try {
                percentage = entity.getScore().divide(new BigDecimal(totalMarks), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(2, RoundingMode.HALF_UP);
            } catch (Exception ignored) {
                percentage = BigDecimal.ZERO;
            }
        }

        return QuizAttemptDto.Response.builder()
                .id(entity.getId())
                .quizId(quiz != null ? quiz.getId() : null)
                .quizTitle(quiz != null ? quiz.getTitle() : "Assessment")
                .studentId(student != null ? student.getId() : null)
                .studentName(studentName)
                .studentEnrollmentNumber(student != null ? student.getEnrollmentNo() : "N/A")
                .studentProfilePictureUrl(profilePictureUrl)
                .studentAvatar(avatarUrl)
                .score(entity.getScore())
                .totalMarks(totalMarks)
                .percentage(percentage)
                .passed(entity.getIsPassed())
                .grade(entity.getGrade())
                .isLate(entity.getIsLate() != null && entity.getIsLate())
                .correctAnswers(entity.getCorrectAnswers() != null ? entity.getCorrectAnswers() : 0)
                .wrongAnswers(entity.getWrongAnswers() != null ? entity.getWrongAnswers() : 0)
                .unattemptedQuestions(entity.getUnattemptedQuestions() != null ? entity.getUnattemptedQuestions() : 0)
                .resultSummary(entity.getResultSummary())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .evaluatedAt(entity.getEvaluatedAt())
                .submittedAnswers(entity.getSubmittedAnswers())
                .build();
    }
}
