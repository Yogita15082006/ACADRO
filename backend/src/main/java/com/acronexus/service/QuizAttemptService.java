package com.acronexus.service;

import com.acronexus.dto.QuizAttemptDto;
import com.acronexus.dto.QuizQuestionDto;
import java.util.List;
import java.util.UUID;

public interface QuizAttemptService {
    List<QuizAttemptDto.Response> getAttemptsForQuiz(UUID quizId);
    List<QuizQuestionDto.Response> startQuiz(UUID quizId);
    QuizAttemptDto.Response submitQuiz(UUID quizId, QuizAttemptDto.SubmitRequest request);
    List<QuizAttemptDto.Response> getStudentResults();
    List<QuizAttemptDto.Response> getAttemptsForQuizAdmin(UUID quizId);
    QuizAttemptDto.CompleteAnalysisResponse getAttemptAnalysis(UUID attemptId);
}
