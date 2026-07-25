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

        BigDecimal percentage = null;
        if (entity.getScore() != null && entity.getQuiz() != null && entity.getQuiz().getTotalMarks() != null && entity.getQuiz().getTotalMarks() > 0) {
            percentage = entity.getScore().divide(new BigDecimal(entity.getQuiz().getTotalMarks()), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return QuizAttemptDto.Response.builder()
                .id(entity.getId())
                .quizId(entity.getQuiz().getId())
                .quizTitle(entity.getQuiz().getTitle())
                .studentId(entity.getStudent().getId())
                .studentName(entity.getStudent().getUser().getFirstName() + " " + entity.getStudent().getUser().getLastName())
                .score(entity.getScore())
                // Assuming we can get total marks from Quiz (actually quiz.totalMarks or sum of question marks)
                // Need to compute these in the service, but let's map what we can.
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .build();
    }
}
