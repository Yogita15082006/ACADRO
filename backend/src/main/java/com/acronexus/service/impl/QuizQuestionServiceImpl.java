package com.acronexus.service.impl;

import com.acronexus.dto.QuizQuestionDto;
import com.acronexus.entity.Quiz;
import com.acronexus.entity.QuizQuestion;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.QuizQuestionMapper;
import com.acronexus.repository.QuizQuestionRepository;
import com.acronexus.repository.QuizRepository;
import com.acronexus.service.QuizQuestionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizQuestionServiceImpl implements QuizQuestionService {

    private final QuizQuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionMapper mapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public QuizQuestionDto.Response addQuestion(QuizQuestionDto.CreateRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        QuizQuestion question = new QuizQuestion();
        question.setQuiz(quiz);
        question.setQuestionText(request.getQuestionText());
        question.setOptions(objectMapper.convertValue(request.getOptions() != null ? request.getOptions() : new java.util.ArrayList<>(), new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}));
        question.setMarks(request.getMarks() != null ? request.getMarks() : 1);
        question.setQuestionType(request.getQuestionType() != null ? request.getQuestionType() : "MCQ");
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setExplanation(request.getExplanation());

        QuizQuestionDto.Response response = mapper.toResponseDto(questionRepository.save(question));
        updateQuizMetadata(quiz);
        return response;
    }

    @Override
    @Transactional
    public QuizQuestionDto.Response updateQuestion(UUID questionId, QuizQuestionDto.UpdateRequest request) {
        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        question.setQuestionText(request.getQuestionText());
        question.setOptions(objectMapper.convertValue(request.getOptions() != null ? request.getOptions() : new java.util.ArrayList<>(), new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}));
        question.setMarks(request.getMarks() != null ? request.getMarks() : 1);
        question.setQuestionType(request.getQuestionType() != null ? request.getQuestionType() : "MCQ");
        question.setCorrectAnswer(request.getCorrectAnswer());

        QuizQuestionDto.Response response = mapper.toResponseDto(questionRepository.save(question));
        updateQuizMetadata(question.getQuiz());
        return response;
    }

    @Override
    @Transactional
    public void deleteQuestion(UUID questionId) {
        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        Quiz quiz = question.getQuiz();
        questionRepository.deleteById(questionId);
        updateQuizMetadata(quiz);
    }

    private void updateQuizMetadata(Quiz quiz) {
        List<QuizQuestion> allQs = questionRepository.findByQuiz_Id(quiz.getId());
        quiz.setQuestionCount(allQs.size());
        if (!allQs.isEmpty()) {
            java.util.Set<String> distinctTypes = allQs.stream()
                    .map(q -> q.getQuestionType() != null && !q.getQuestionType().trim().isEmpty() ? q.getQuestionType().trim() : "MCQ")
                    .collect(java.util.stream.Collectors.toSet());
            if (distinctTypes.size() > 1) {
                quiz.setQuestionType("Mixed Questions");
            } else {
                String type = distinctTypes.iterator().next();
                quiz.setQuestionType("True/False".equalsIgnoreCase(type) ? "True / False" : type);
            }
        }
        quizRepository.save(quiz);
    }


    @Override
    @Transactional(readOnly = true)
    public List<QuizQuestionDto.Response> getQuestionsByQuiz(UUID quizId) {
        if (!quizRepository.existsById(quizId)) {
            throw new ResourceNotFoundException("Quiz not found");
        }
        return questionRepository.findByQuiz_Id(quizId).stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }
}
