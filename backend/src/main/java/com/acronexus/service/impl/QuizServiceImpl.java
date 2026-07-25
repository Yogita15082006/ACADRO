package com.acronexus.service.impl;

import com.acronexus.dto.QuizDto;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.Quiz;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.exception.UnauthorizedException;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.QuizRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.AiService;
import com.acronexus.service.QuizService;
import com.acronexus.dto.ai.AiAnalyticsRequest;
import com.acronexus.dto.ai.AiInsightDto;
import com.acronexus.entity.QuizQuestion;
import com.acronexus.repository.QuizQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final UserRepository userRepository;
    private final AiService aiService;
    private final QuizQuestionRepository quizQuestionRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        throw new UnauthorizedException("User not authenticated");
    }

    private void verifyFacultyOwnership(Quiz quiz, User user) {
        if (user.getRole() == UserRole.FACULTY && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedException("You are not authorized to manage this quiz.");
        }
    }

    @Override
    @Transactional
    public QuizDto.Response createQuiz(QuizDto.CreateRequest request) {
        User facultyUser = getCurrentUser();

        ClassSubject classSubject = classSubjectRepository.findById(request.getClassSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Class Subject not found"));

        if (facultyUser.getRole() == UserRole.FACULTY && !classSubject.getFaculty().getId().equals(facultyUser.getId())) {
            throw new UnauthorizedException("You are not authorized to create a quiz for this subject.");
        }

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        Quiz quiz = new Quiz();
        quiz.setClassSubject(classSubject);
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setStartTime(request.getStartTime());
        quiz.setEndTime(request.getEndTime());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setTotalMarks(request.getTotalMarks());
        quiz.setCreatedBy(facultyUser);
        quiz.setIsDeleted(false);

        Quiz saved = quizRepository.save(quiz);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QuizDto.Response updateQuiz(UUID quizId, QuizDto.UpdateRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        verifyFacultyOwnership(quiz, getCurrentUser());

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setStartTime(request.getStartTime());
        quiz.setEndTime(request.getEndTime());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setTotalMarks(request.getTotalMarks());

        return mapToResponse(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        verifyFacultyOwnership(quiz, getCurrentUser());
        
        quiz.setIsDeleted(true);
        quizRepository.save(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizDto.Response> getFacultyQuizzes() {
        return quizRepository.findByCreatedByIdAndIsDeletedFalse(getCurrentUser().getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizDto.Response> getAvailableQuizzesForStudent() {
        return quizRepository.findAvailableQuizzesForStudent(getCurrentUser().getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private QuizDto.Response mapToResponse(Quiz quiz) {
        Instant now = Instant.now();
        String status = "UPCOMING";
        if (now.isAfter(quiz.getStartTime()) && now.isBefore(quiz.getEndTime())) {
            status = "ACTIVE";
        } else if (now.isAfter(quiz.getEndTime())) {
            status = "COMPLETED";
        }

        return QuizDto.Response.builder()
                .id(quiz.getId())
                .classSubjectId(quiz.getClassSubject().getId())
                .subjectName(quiz.getClassSubject().getSubject().getName())
                .className(quiz.getClassSubject().getAcroClass().getName() + " " + quiz.getClassSubject().getAcroClass().getSection())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .startTime(quiz.getStartTime())
                .endTime(quiz.getEndTime())
                .durationMinutes(quiz.getDurationMinutes())
                .totalMarks(quiz.getTotalMarks())
                .status(status)
                .createdBy(quiz.getCreatedBy().getId())
                .createdByName(quiz.getCreatedBy().getFirstName() + " " + quiz.getCreatedBy().getLastName())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightDto getQuizDifficultyAnalysis(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        verifyFacultyOwnership(quiz, getCurrentUser());
        
        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_Id(quizId);
        
        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_DIFFICULTY")
                .contextType("quiz")
                .contextId(quizId.toString())
                .data(java.util.Map.of(
                        "title", quiz.getTitle(),
                        "description", quiz.getDescription(),
                        "totalMarks", quiz.getTotalMarks(),
                        "durationMinutes", quiz.getDurationMinutes(),
                        "questions", questions.stream().map(q -> java.util.Map.of(
                                "question", q.getQuestionText(),
                                "marks", q.getMarks()
                        )).collect(Collectors.toList())
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightDto getQuestionQualityAnalysis(UUID questionId) {
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        verifyFacultyOwnership(question.getQuiz(), getCurrentUser());
        
        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_QUESTION_QUALITY")
                .contextType("quiz-question")
                .contextId(questionId.toString())
                .data(java.util.Map.of(
                        "questionText", question.getQuestionText(),
                        "marks", question.getMarks(),
                        "options", question.getOptions()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightDto generateQuestions(UUID classSubjectId, String topic, int count) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Class Subject not found"));
                
        User facultyUser = getCurrentUser();
        if (facultyUser.getRole() == UserRole.FACULTY && !classSubject.getFaculty().getId().equals(facultyUser.getId())) {
            throw new UnauthorizedException("You are not authorized for this subject.");
        }
        
        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_QUESTION_GENERATION")
                .contextType("question-generation")
                .contextId(classSubjectId.toString())
                .data(java.util.Map.of(
                        "topic", topic,
                        "count", count,
                        "subjectName", classSubject.getSubject().getName(),
                        "subjectCode", classSubject.getSubject().getCode()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightDto getPersonalizedRecommendations() {
        User student = getCurrentUser();
        List<Quiz> quizzes = quizRepository.findAvailableQuizzesForStudent(student.getId());
        
        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_RECOMMENDATIONS")
                .contextType("quiz-recommendation")
                .contextId(student.getId().toString())
                .data(java.util.Map.of(
                        "availableQuizzes", quizzes.stream().map(q -> java.util.Map.of(
                                "id", q.getId(),
                                "title", q.getTitle(),
                                "subject", q.getClassSubject().getSubject().getName(),
                                "deadline", q.getEndTime().toString()
                        )).collect(Collectors.toList())
                ))
                .build();
                
        return aiService.getInsights(request);
    }
}
