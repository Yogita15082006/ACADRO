package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.QuizAttemptDto;
import com.acronexus.dto.QuizDto;
import com.acronexus.dto.QuizQuestionDto;
import com.acronexus.service.QuizAttemptService;
import com.acronexus.service.QuizQuestionService;
import com.acronexus.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.acronexus.dto.ai.AiInsightDto;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final QuizQuestionService questionService;
    private final QuizAttemptService attemptService;

    // ==========================================
    // FACULTY ENDPOINTS
    // ==========================================

    @PostMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<QuizDto.Response>> createQuiz(@Valid @RequestBody QuizDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz created successfully", quizService.createQuiz(request)));
    }

    @PutMapping("/faculty/{quizId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<QuizDto.Response>> updateQuiz(@PathVariable UUID quizId, @Valid @RequestBody QuizDto.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Quiz updated successfully", quizService.updateQuiz(quizId, request)));
    }

    @DeleteMapping("/faculty/{quizId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable UUID quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully", null));
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<List<QuizDto.Response>>> getFacultyQuizzes() {
        return ResponseEntity.ok(ApiResponse.success("Quizzes fetched successfully", quizService.getFacultyQuizzes()));
    }

    // --- Question Management ---

    @PostMapping("/faculty/{quizId}/questions")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<QuizQuestionDto.Response>> addQuestion(
            @PathVariable UUID quizId, 
            @Valid @RequestBody QuizQuestionDto.CreateRequest request) {
        request.setQuizId(quizId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added successfully", questionService.addQuestion(request)));
    }

    @PutMapping("/faculty/questions/{questionId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<QuizQuestionDto.Response>> updateQuestion(
            @PathVariable UUID questionId, 
            @Valid @RequestBody QuizQuestionDto.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", questionService.updateQuestion(questionId, request)));
    }

    @DeleteMapping("/faculty/questions/{questionId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable UUID questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully", null));
    }

    @GetMapping({ "/faculty/{quizId}/questions", "/{quizId}/questions", "/student/{quizId}/questions" })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<QuizQuestionDto.Response>>> getQuestionsForFaculty(@PathVariable UUID quizId) {
        return ResponseEntity.ok(ApiResponse.success("Questions fetched successfully", questionService.getQuestionsByQuiz(quizId)));
    }
    
    // --- Result APIs (Faculty) ---
    @GetMapping("/faculty/{quizId}/attempts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<QuizAttemptDto.Response>>> getAttemptsForQuiz(@PathVariable UUID quizId) {
        return ResponseEntity.ok(ApiResponse.success("Attempts fetched successfully", attemptService.getAttemptsForQuiz(quizId)));
    }

    // --- AI Analytics APIs (Faculty) ---
    @GetMapping("/faculty/{quizId}/ai/difficulty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<AiInsightDto>> getDifficultyAnalysis(@PathVariable UUID quizId) {
        return ResponseEntity.ok(ApiResponse.success("Quiz difficulty analysis generated", quizService.getQuizDifficultyAnalysis(quizId)));
    }

    @GetMapping("/faculty/questions/{questionId}/ai/quality")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<AiInsightDto>> getQuestionQualityAnalysis(@PathVariable UUID questionId) {
        return ResponseEntity.ok(ApiResponse.success("Question quality analysis generated", quizService.getQuestionQualityAnalysis(questionId)));
    }

    @GetMapping("/faculty/subjects/{classSubjectId}/ai/generate-questions")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<AiInsightDto>> generateQuestions(
            @PathVariable UUID classSubjectId,
            @RequestParam String topic,
            @RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(ApiResponse.success("Questions generated successfully", quizService.generateQuestions(classSubjectId, topic, count)));
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    @GetMapping("/student/available")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<QuizDto.Response>>> getAvailableQuizzes() {
        return ResponseEntity.ok(ApiResponse.success("Available quizzes fetched successfully", quizService.getAvailableQuizzesForStudent()));
    }

    @GetMapping("/student/{quizId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<QuizQuestionDto.Response>>> startQuiz(@PathVariable UUID quizId) {
        // Validation of eligibility, timings, duplicate attempts happens in the service
        return ResponseEntity.ok(ApiResponse.success("Quiz started successfully", attemptService.startQuiz(quizId)));
    }

    @PostMapping("/student/{quizId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<QuizAttemptDto.Response>> submitQuiz(
            @PathVariable UUID quizId, 
            @Valid @RequestBody QuizAttemptDto.SubmitRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Quiz submitted successfully", attemptService.submitQuiz(quizId, request)));
    }
    
    @GetMapping("/student/results")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<QuizAttemptDto.Response>>> getStudentResults() {
        return ResponseEntity.ok(ApiResponse.success("Results fetched successfully", attemptService.getStudentResults()));
    }

    @GetMapping("/attempts/{id}/analysis")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<QuizAttemptDto.CompleteAnalysisResponse>> getAttemptAnalysis(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Attempt analysis fetched successfully", attemptService.getAttemptAnalysis(id)));
    }

    // --- AI Analytics APIs (Student) ---
    @GetMapping("/student/ai/recommendations")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AiInsightDto>> getPersonalizedRecommendations() {
        return ResponseEntity.ok(ApiResponse.success("Personalized recommendations generated", quizService.getPersonalizedRecommendations()));
    }

    // ==========================================
    // ADMIN / HOD ENDPOINTS
    // ==========================================
    
    @GetMapping("/admin/{quizId}/attempts")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<QuizAttemptDto.Response>>> getQuizReports(@PathVariable UUID quizId) {
        return ResponseEntity.ok(ApiResponse.success("Quiz reports fetched successfully", attemptService.getAttemptsForQuizAdmin(quizId)));
    }

    // ==========================================
    // LMS WORKSPACE & AI ADVANCED ENDPOINTS
    // ==========================================

    @GetMapping("/subject/{classSubjectId}")
    public ResponseEntity<ApiResponse<List<QuizDto.Response>>> getQuizzesBySubject(@PathVariable UUID classSubjectId) {
        return ResponseEntity.ok(ApiResponse.success("Quizzes for subject fetched successfully", quizService.getQuizzesBySubject(classSubjectId)));
    }

    @PostMapping("/faculty/{quizId}/grade")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> evaluateQuiz(@PathVariable UUID quizId, @RequestBody(required = false) java.util.Map<UUID, String> answerKeyUpdates) {
        quizService.evaluateQuiz(quizId, answerKeyUpdates);
        return ResponseEntity.ok(ApiResponse.success("Quiz evaluated and graded successfully", null));
    }

    @GetMapping("/faculty/{quizId}/ai/generate-answer-key")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<AiInsightDto>> generateAnswerKey(@PathVariable UUID quizId) {
        return ResponseEntity.ok(ApiResponse.success("Answer key generated via AI", quizService.generateAnswerKey(quizId)));
    }

    @GetMapping("/faculty/subjects/{classSubjectId}/ai/generate-questions-advanced")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<AiInsightDto>> generateQuestionsAdvanced(
            @PathVariable UUID classSubjectId,
            @RequestParam String topic,
            @RequestParam(required = false) String unitSyllabus,
            @RequestParam(defaultValue = "5") int count,
            @RequestParam(defaultValue = "Medium") String difficulty,
            @RequestParam(defaultValue = "MCQ") String questionType,
            @RequestParam(defaultValue = "1") int marksPerQuestion) {
        return ResponseEntity.ok(ApiResponse.success("Advanced questions generated via AI", 
                quizService.generateQuestionsAdvanced(classSubjectId, topic, unitSyllabus, count, difficulty, questionType, marksPerQuestion)));
    }

    @PostMapping(value = "/faculty/extract-source")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<List<QuizQuestionDto.CreateRequest>>> extractFromSource(
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String sourceUrl) {
        return ResponseEntity.ok(ApiResponse.success("Questions extracted from source via AI", 
                quizService.extractQuestionsFromSource(sourceType, sourceUrl)));
    }
}

