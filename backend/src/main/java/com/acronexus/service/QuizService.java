package com.acronexus.service;

import com.acronexus.dto.QuizDto;
import java.util.List;
import java.util.UUID;

public interface QuizService {
    QuizDto.Response createQuiz(QuizDto.CreateRequest request);
    QuizDto.Response updateQuiz(UUID quizId, QuizDto.UpdateRequest request);
    void deleteQuiz(UUID quizId);
    List<QuizDto.Response> getFacultyQuizzes();
    List<QuizDto.Response> getAvailableQuizzesForStudent();

    com.acronexus.dto.ai.AiInsightDto getQuizDifficultyAnalysis(UUID quizId);
    com.acronexus.dto.ai.AiInsightDto getQuestionQualityAnalysis(UUID questionId);
    com.acronexus.dto.ai.AiInsightDto generateQuestions(UUID classSubjectId, String topic, int count);
    com.acronexus.dto.ai.AiInsightDto generateQuestionsAdvanced(UUID classSubjectId, String topic, String unitSyllabus, int count, String difficulty, String questionType, int marksPerQuestion);
    com.acronexus.dto.ai.AiInsightDto generateAnswerKey(UUID quizId);
    void evaluateQuiz(UUID quizId, java.util.Map<UUID, String> answerKeyUpdates);
    List<QuizDto.Response> getQuizzesBySubject(UUID classSubjectId);
    com.acronexus.dto.ai.AiInsightDto getPersonalizedRecommendations();
    List<com.acronexus.dto.QuizQuestionDto.CreateRequest> extractQuestionsFromSource(String sourceType, String sourceUrl);
}

