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
import com.acronexus.dto.QuizQuestionDto;
import com.acronexus.entity.QuizQuestion;
import com.acronexus.entity.QuizAttempt;
import com.acronexus.repository.QuizQuestionRepository;
import com.acronexus.repository.QuizAttemptRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
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
    private final QuizAttemptRepository quizAttemptRepository;
    private final ObjectMapper objectMapper;

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
        quiz.setPassingMarks(request.getPassingMarks() != null ? request.getPassingMarks() : (request.getTotalMarks() != null ? request.getTotalMarks() * 40 / 100 : 0));
        quiz.setSourceType(request.getSourceType() != null ? request.getSourceType() : "MANUAL");
        quiz.setSourceUrl(request.getSourceUrl());
        quiz.setQuestionType(request.getQuestionType() != null ? request.getQuestionType() : "MCQ");
        quiz.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "Medium");
        quiz.setQuestionCount(request.getQuestionCount() != null ? request.getQuestionCount() : 0);
        quiz.setIsGraded(false);
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

        if (request.getStartTime() != null && request.getEndTime() != null) {
            if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
                throw new IllegalArgumentException("Start time must be before end time");
            }
        }

        if (request.getTitle() != null) quiz.setTitle(request.getTitle());
        if (request.getDescription() != null) quiz.setDescription(request.getDescription());
        if (request.getStartTime() != null) quiz.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) quiz.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) quiz.setDurationMinutes(request.getDurationMinutes());
        if (request.getTotalMarks() != null) quiz.setTotalMarks(request.getTotalMarks());
        if (request.getPassingMarks() != null) quiz.setPassingMarks(request.getPassingMarks());
        if (request.getIsGraded() != null) quiz.setIsGraded(request.getIsGraded());
        if (request.getQuestionType() != null) quiz.setQuestionType(request.getQuestionType());
        if (request.getDifficulty() != null) quiz.setDifficulty(request.getDifficulty());
        if (request.getQuestionCount() != null) quiz.setQuestionCount(request.getQuestionCount());

        return mapToResponse(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        verifyFacultyOwnership(quiz, getCurrentUser());
        
        quizAttemptRepository.deleteByQuiz_Id(quizId);
        quizQuestionRepository.deleteByQuiz_Id(quizId);
        quizRepository.delete(quiz);
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

        String facultyName = quiz.getCreatedBy().getFirstName() + " " + quiz.getCreatedBy().getLastName();
        if (quiz.getClassSubject() != null && quiz.getClassSubject().getFaculty() != null && quiz.getClassSubject().getFaculty().getUser() != null) {
            facultyName = quiz.getClassSubject().getFaculty().getUser().getFirstName() + " " + quiz.getClassSubject().getFaculty().getUser().getLastName();
        }
        List<QuizQuestion> dbQuestions = quizQuestionRepository.findByQuiz_Id(quiz.getId());
        int actualQCount = !dbQuestions.isEmpty() ? dbQuestions.size() : (quiz.getQuestionCount() != null ? quiz.getQuestionCount() : 0);
        String actualQType = quiz.getQuestionType();
        if (!dbQuestions.isEmpty()) {
            java.util.Set<String> distinctTypes = dbQuestions.stream()
                    .map(q -> q.getQuestionType() != null && !q.getQuestionType().trim().isEmpty() ? q.getQuestionType().trim() : "MCQ")
                    .collect(java.util.stream.Collectors.toSet());
            if (distinctTypes.size() > 1) {
                actualQType = "Mixed Questions";
            } else if (!distinctTypes.isEmpty()) {
                actualQType = distinctTypes.iterator().next();
                if ("True/False".equalsIgnoreCase(actualQType)) {
                    actualQType = "True / False";
                }
            }
        }
        if (actualQType == null || actualQType.trim().isEmpty()) {
            actualQType = "MCQ";
        }

        String baseClassName = (quiz.getClassSubject().getAcroClass().getName() != null && !quiz.getClassSubject().getAcroClass().getName().equalsIgnoreCase("null")) ? quiz.getClassSubject().getAcroClass().getName().trim() : "";
        String sectionName = (quiz.getClassSubject().getAcroClass().getSection() != null && !quiz.getClassSubject().getAcroClass().getSection().equalsIgnoreCase("null") && !quiz.getClassSubject().getAcroClass().getSection().trim().isEmpty()) ? quiz.getClassSubject().getAcroClass().getSection().trim() : "";
        String resolvedClassName = baseClassName;
        if (!sectionName.isEmpty()) {
            resolvedClassName = baseClassName.isEmpty() ? sectionName : baseClassName + " - " + sectionName;
        }
        if (resolvedClassName.isEmpty()) {
            resolvedClassName = "Assigned Class";
        }

        return QuizDto.Response.builder()
                .id(quiz.getId())
                .classSubjectId(quiz.getClassSubject().getId())
                .subjectName(quiz.getClassSubject().getSubject().getName())
                .className(resolvedClassName)
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .startTime(quiz.getStartTime())
                .endTime(quiz.getEndTime())
                .durationMinutes(quiz.getDurationMinutes())
                .totalMarks(quiz.getTotalMarks())
                .passingMarks(quiz.getPassingMarks())
                .sourceType(quiz.getSourceType())
                .sourceUrl(quiz.getSourceUrl())
                .isGraded(quiz.getIsGraded() != null && quiz.getIsGraded())
                .status(status)
                .createdBy(quiz.getCreatedBy().getId())
                .createdByName(quiz.getCreatedBy().getFirstName() + " " + quiz.getCreatedBy().getLastName())
                .facultyName(facultyName)
                .questionType(actualQType)
                .difficulty(quiz.getDifficulty() != null ? quiz.getDifficulty() : "Medium")
                .questionCount(actualQCount)
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

    @Override
    @Transactional(readOnly = true)
    public List<QuizDto.Response> getQuizzesBySubject(UUID classSubjectId) {
        return quizRepository.findByClassSubject_IdAndIsDeletedFalseOrderByStartTimeDesc(classSubjectId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightDto generateQuestionsAdvanced(UUID classSubjectId, String topic, String unitSyllabus, int count, String difficulty, String questionType, int marksPerQuestion) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Class Subject not found"));
        User facultyUser = getCurrentUser();
        if (facultyUser.getRole() == UserRole.FACULTY && !classSubject.getFaculty().getId().equals(facultyUser.getId())) {
            throw new UnauthorizedException("You are not authorized for this subject.");
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("topic", topic);
        payload.put("topicOrSyllabus", unitSyllabus != null && !unitSyllabus.trim().isEmpty() ? unitSyllabus : topic);
        payload.put("count", count);
        payload.put("difficulty", difficulty);
        payload.put("questionType", questionType);
        payload.put("marksPerQuestion", marksPerQuestion);
        payload.put("subjectName", classSubject.getSubject().getName());
        payload.put("subjectCode", classSubject.getSubject().getCode());
        payload.put("timestamp", System.currentTimeMillis() + "-" + java.util.UUID.randomUUID().toString());

        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_QUESTION_GENERATION")
                .contextType("question-generation")
                .contextId(classSubjectId.toString())
                .data(payload)
                .build();
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightDto generateAnswerKey(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        verifyFacultyOwnership(quiz, getCurrentUser());
        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_Id(quizId);

        List<Map<String, Object>> qList = questions.stream().map(q -> {
            Map<String, Object> m = new HashMap<>();
            m.put("questionId", q.getId());
            m.put("questionText", q.getQuestionText());
            m.put("questionType", q.getQuestionType());
            m.put("options", q.getOptions());
            return m;
        }).collect(Collectors.toList());

        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_ANSWER_KEY_GENERATION")
                .contextType("quiz")
                .contextId(quizId.toString())
                .data(Map.of("quizTitle", quiz.getTitle(), "questions", qList))
                .build();
        return aiService.getInsights(request);
    }

    @Override
    @Transactional
    public void evaluateQuiz(UUID quizId, Map<UUID, String> answerKeyUpdates) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        verifyFacultyOwnership(quiz, getCurrentUser());
        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_Id(quizId);
        
        if (answerKeyUpdates != null && !answerKeyUpdates.isEmpty()) {
            for (QuizQuestion q : questions) {
                String updateAns = answerKeyUpdates.get(q.getId());
                if (updateAns != null) {
                    q.setCorrectAnswer(updateAns);
                    if (q.getOptions() != null) {
                        try {
                            List<QuizQuestionDto.Option> opts = objectMapper.convertValue(q.getOptions(), new TypeReference<>() {});
                            if (opts != null && !opts.isEmpty()) {
                                boolean updated = false;
                                for (QuizQuestionDto.Option opt : opts) {
                                    if (opt.getId().equalsIgnoreCase(updateAns) || opt.getText().equalsIgnoreCase(updateAns)) {
                                        opt.setCorrect(true);
                                        updated = true;
                                    } else {
                                        opt.setCorrect(false);
                                    }
                                }
                                if (updated) {
                                    q.setOptions(objectMapper.convertValue(opts, new TypeReference<List<Map<String, Object>>>() {}));
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                    quizQuestionRepository.save(q);
                }
            }
        }

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz_Id(quizId);
        int totalQuizMarks = quiz.getTotalMarks() != null && quiz.getTotalMarks() > 0 
                ? quiz.getTotalMarks() 
                : questions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1).sum();

        for (QuizAttempt attempt : attempts) {
            int obtainedMarks = 0;
            int correctCount = 0;
            int incorrectCount = 0;
            int unattemptedCount = 0;

            if (attempt.getSubmittedAnswers() != null) {
                try {
                    Map<String, String> ansMap = objectMapper.convertValue(attempt.getSubmittedAnswers(), new TypeReference<Map<String, String>>() {});
                    for (int i = 0; i < questions.size(); i++) {
                        QuizQuestion q = questions.get(i);
                        String studentAns = ansMap.get(q.getId().toString());
                        if (studentAns == null) studentAns = ansMap.get(String.valueOf(i));
                        
                        if (studentAns == null || studentAns.trim().isEmpty()) {
                            unattemptedCount++;
                            continue;
                        }

                        boolean correct = false;
                        if ("Fill in the Blanks".equalsIgnoreCase(q.getQuestionType()) || "Short Answer".equalsIgnoreCase(q.getQuestionType())) {
                            if (q.getCorrectAnswer() != null && studentAns.trim().equalsIgnoreCase(q.getCorrectAnswer().trim())) {
                                correct = true;
                            } else if ("Short Answer".equalsIgnoreCase(q.getQuestionType()) && q.getCorrectAnswer() != null && !q.getCorrectAnswer().trim().isEmpty()) {
                                if (studentAns.trim().toLowerCase().contains(q.getCorrectAnswer().trim().toLowerCase()) || q.getCorrectAnswer().trim().toLowerCase().contains(studentAns.trim().toLowerCase())) {
                                    correct = true;
                                }
                            }
                        } else if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                            List<QuizQuestionDto.Option> opts = objectMapper.convertValue(q.getOptions(), new TypeReference<>() {});
                            if (opts != null) {
                                String target = studentAns;
                                correct = opts.stream().anyMatch(opt -> opt.isCorrect() && (opt.getId().equalsIgnoreCase(target) || opt.getText().equalsIgnoreCase(target)));
                            }
                        } else if (q.getCorrectAnswer() != null && q.getCorrectAnswer().equalsIgnoreCase(studentAns.trim())) {
                            correct = true;
                        }

                        if (correct) {
                            obtainedMarks += (q.getMarks() != null ? q.getMarks() : 1);
                            correctCount++;
                        } else {
                            incorrectCount++;
                        }
                    }
                } catch (Exception ignored) {}
            } else {
                unattemptedCount = questions.size();
            }

            attempt.setScore(new BigDecimal(obtainedMarks));
            boolean passed = false;
            int passing = quiz.getPassingMarks() != null ? quiz.getPassingMarks() : (totalQuizMarks * 40 / 100);
            if (obtainedMarks >= passing) passed = true;
            attempt.setIsPassed(passed);

            double pct = totalQuizMarks > 0 ? ((double) obtainedMarks / totalQuizMarks) * 100.0 : 0.0;
            String grade = "F";
            if (pct >= 90.0) grade = "A+";
            else if (pct >= 80.0) grade = "A";
            else if (pct >= 70.0) grade = "B+";
            else if (pct >= 60.0) grade = "B";
            else if (pct >= 50.0) grade = "C";
            else if (pct >= 40.0) grade = "D";
            attempt.setGrade(grade);
            attempt.setPercentage(new BigDecimal(pct).setScale(2, java.math.RoundingMode.HALF_UP));
            attempt.setCorrectAnswers(correctCount);
            attempt.setWrongAnswers(incorrectCount);
            attempt.setUnattemptedQuestions(unattemptedCount);
            attempt.setResultSummary(String.format("Faculty Manual Evaluation Complete. Correct: %d, Incorrect: %d, Missed: %d. Final Score: %d/%d (%s).", correctCount, incorrectCount, unattemptedCount, obtainedMarks, totalQuizMarks, (passed ? "PASSED" : "FAILED")));
            attempt.setEvaluatedAt(Instant.now());
            quizAttemptRepository.save(attempt);
        }

        quiz.setIsGraded(true);
        quizRepository.save(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizQuestionDto.CreateRequest> extractQuestionsFromSource(String sourceType, String sourceUrl) {

        System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ URL received: " + sourceUrl);
        if (sourceUrl == null || sourceUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("URL is invalid. Please provide a valid public URL containing quiz questions.");
        }
        String cleanedContent;
        int detectedQuestionsPreAi = 0;
        try {
            String urlStr = sourceUrl.trim();
            if (!urlStr.toLowerCase().startsWith("http://") && !urlStr.toLowerCase().startsWith("https://")) {
                throw new IllegalArgumentException("URL is invalid. Only HTTP and HTTPS protocols are supported.");
            }
            java.net.URI currentUri = new java.net.URI(urlStr);
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .followRedirects(java.net.http.HttpClient.Redirect.ALWAYS)
                    .connectTimeout(java.time.Duration.ofSeconds(12))
                    .build();
            java.net.http.HttpResponse<String> response = null;
            int redirectCount = 0;
            List<String> redirectChain = new java.util.ArrayList<>();
            redirectChain.add(currentUri.toString());

            while (redirectCount < 5) {
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                        .uri(currentUri)
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                        .header("Accept-Language", "en-US,en;q=0.9")
                        .header("Upgrade-Insecure-Requests", "1")
                        .header("Sec-Fetch-Dest", "document")
                        .header("Sec-Fetch-Mode", "navigate")
                        .header("Sec-Fetch-Site", "none")
                        .timeout(java.time.Duration.ofSeconds(15))
                        .GET()
                        .build();
                response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
                int status = response.statusCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    java.util.Optional<String> location = response.headers().firstValue("location");
                    if (location.isPresent() && !location.get().trim().isEmpty()) {
                        currentUri = currentUri.resolve(new java.net.URI(location.get().trim()));
                        redirectChain.add(currentUri.toString());
                        redirectCount++;
                        continue;
                    }
                }
                break;
            }

            if (response == null || response.body() == null || response.body().trim().isEmpty()) {

                throw new IllegalArgumentException("Unable to fetch webpage. Received an empty response from the server.");
            }

            int status = response.statusCode();
            String contentType = response.headers().firstValue("content-type").orElse("unknown").toLowerCase();
            String body = response.body();

            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ HTTP response code: " + status);
            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ Redirect chain: " + String.join(" -> ", redirectChain));
            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ Final URL: " + currentUri.toString());
            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ Content-Type: " + contentType);


            if (status == 401 || status == 403 || status == 407) {
                throw new IllegalArgumentException("Website blocked automated requests (HTTP " + status + "). Permission denied or anti-scraping firewall detected.");
            }
            if (status == 404) {
                throw new IllegalArgumentException("Unable to fetch webpage (HTTP 404 Not Found). Please verify that the URL path exists.");
            }
            if (status >= 500) {
                throw new IllegalArgumentException("Unable to fetch webpage. Website server encountered an error (HTTP " + status + ").");
            }
            if (status >= 400) {
                throw new IllegalArgumentException("Unable to fetch webpage. Website returned HTTP error " + status + ".");
            }

            if (contentType.contains("application/zip") || contentType.contains("image/") || contentType.contains("audio/") || contentType.contains("video/")) {
                throw new IllegalArgumentException("URL points to an incompatible file type (" + contentType + "). Please provide a link to a readable webpage or document.");
            }

            if (body.contains("Sign in - Google Accounts") || body.contains("login.microsoftonline.com") 
                    || ((body.contains("Sign in") || body.contains("Please log in")) && body.contains("password") && body.length() < 3000)) {
                throw new IllegalArgumentException("Authentication required. This URL is private or behind a login screen.");
            }

            StringBuilder embeddedScriptData = new StringBuilder();
            java.util.regex.Pattern scriptPattern = java.util.regex.Pattern.compile("(?ims)<script[^>]*>(.*?)</script>");
            java.util.regex.Matcher scriptMatcher = scriptPattern.matcher(body);
            while (scriptMatcher.find()) {
                String scriptContent = scriptMatcher.group(1);
                String lowerScript = scriptContent.toLowerCase();
                if (lowerScript.contains("question") || lowerScript.contains("quiz") || lowerScript.contains("options") || 
                    lowerScript.contains("correctanswer") || lowerScript.contains("answer") || lowerScript.contains("mcq") || 
                    lowerScript.contains("assessment") || lowerScript.contains("exam") || lowerScript.contains("choices") || 
                    lowerScript.contains("fb_public_load_data_") || lowerScript.contains("af_initdatacallback") || 
                    lowerScript.contains("__next_data__") || lowerScript.contains("initial_state") || lowerScript.contains("form_data")) {
                    embeddedScriptData.append("\n[EMBEDDED DYNAMIC SCRIPT/JSON DATA]\n").append(scriptContent.trim()).append("\n");
                }
            }

            String visibleText = body.replaceAll("(?ims)<style[^>]*>.*?</style>", " ")
                                     .replaceAll("(?ims)<script[^>]*>.*?</script>", " ")
                                     .replaceAll("(?ims)<noscript[^>]*>.*?</noscript>", " ")
                                     .replaceAll("(?ims)<svg[^>]*>.*?</svg>", " ")
                                     .replaceAll("(?ims)<!--.*?-->", " ")
                                     .replaceAll("(?ims)<[^>]+>", " ")
                                     .replaceAll("\\s+", " ")
                                     .trim();

            if (embeddedScriptData.length() > 0) {
                cleanedContent = embeddedScriptData.toString() + "\n\n[VISIBLE WEBPAGE TEXT]\n" + visibleText;
            } else {
                cleanedContent = visibleText;
            }

            if (cleanedContent.length() < 20) {
                throw new IllegalArgumentException("No questions found. The webpage text is too short or empty.");
            }
            if (cleanedContent.length() > 11500) {
                cleanedContent = cleanedContent.substring(0, 11500);
            }



            java.util.regex.Pattern qMarkerPattern = java.util.regex.Pattern.compile("(?im)(?:^|\\s)(?:\\d+[.):]|Q\\s*\\d+[.):]|\\bQuestion\\s*\\d+\\b|\"questionText\"|\"question\"|\\b\\d{8,13}\\s*,\\s*\"[^\"]{5,150}\"|\"[^\"]+\\?\")");
            java.util.regex.Matcher qMarkerMatcher = qMarkerPattern.matcher(cleanedContent);
            while (qMarkerMatcher.find()) {
                detectedQuestionsPreAi++;
            }
            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ Number of detected questions before AI: ~" + detectedQuestionsPreAi);
        } catch (IllegalArgumentException ie) {
            System.err.println(">>> [URL EXTRACTION PIPELINE] Extraction aborted: " + ie.getMessage());
            throw ie;
        } catch (java.net.http.HttpTimeoutException | java.net.ConnectException | java.net.UnknownHostException e) {
            System.err.println(">>> [URL EXTRACTION PIPELINE] Timeout or unreachable: " + e.getMessage());
            throw new IllegalArgumentException("Unable to fetch webpage. Website is not reachable or connection timed out.");
        } catch (java.net.URISyntaxException e) {
            System.err.println(">>> [URL EXTRACTION PIPELINE] Malformed URL syntax: " + e.getMessage());
            throw new IllegalArgumentException("Unable to fetch webpage. URL syntax is invalid.");
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Unable to fetch webpage: " + e.getMessage());
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("sourceUrl", sourceUrl);
        payload.put("webpageContent", cleanedContent);
        payload.put("timestamp", System.currentTimeMillis() + "-" + java.util.UUID.randomUUID().toString());

        AiAnalyticsRequest request = AiAnalyticsRequest.builder()
                .insightType("QUIZ_URL_QUESTION_EXTRACTION")
                .contextType("source-extraction")
                .contextId(java.util.UUID.randomUUID().toString())
                .data(payload)
                .build();

        try {
            AiInsightDto aiResponse = aiService.getInsights(request);
            if (aiResponse == null) {
                throw new IllegalArgumentException("AI response parsing failed: AI service returned null response.");
            }
            if (aiResponse.getConfidence() != null && aiResponse.getConfidence() == 0.0 && aiResponse.getReasoning() != null && !aiResponse.getReasoning().isEmpty()) {
                System.err.println(">>> [URL EXTRACTION PIPELINE] AI extraction exception/failure: " + aiResponse.getReasoning());
                throw new IllegalArgumentException(aiResponse.getReasoning());
            }
            if (aiResponse.getRawInsights() == null || aiResponse.getRawInsights().trim().isEmpty() || aiResponse.getRawInsights().trim().equals("{}") || aiResponse.getRawInsights().trim().equals("[]")) {

                throw new IllegalArgumentException("No questions found. The source URL was fetched successfully, but the content does not contain extractable quiz questions.");
            }

            String rawJson = aiResponse.getRawInsights().trim();
            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ Final JSON payload: " + rawJson);

            com.fasterxml.jackson.databind.JsonNode rootNode;
            try {
                rootNode = objectMapper.readTree(rawJson);
            } catch (Exception ex) {
                System.err.println(">>> [URL EXTRACTION PIPELINE] AI returned invalid JSON format: " + rawJson);
                throw new IllegalArgumentException("Parsing failed. AI response could not be parsed into valid JSON structure.");
            }

            com.fasterxml.jackson.databind.JsonNode arrayNode = null;
            if (rootNode.isArray()) {
                arrayNode = rootNode;
            } else if (rootNode.isObject()) {
                String[] candidateKeys = {"rawInsights", "questions", "quiz", "quizQuestions", "data", "extractedQuestions", "items", "questionsList"};
                for (String k : candidateKeys) {
                    if (rootNode.has(k) && rootNode.get(k).isArray()) {
                        arrayNode = rootNode.get(k);
                        break;
                    }
                }
                if (arrayNode == null) {
                    java.util.Iterator<Map.Entry<String, com.fasterxml.jackson.databind.JsonNode>> it = rootNode.fields();
                    while (it.hasNext()) {
                        Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> entry = it.next();
                        if (entry.getValue().isArray()) {
                            arrayNode = entry.getValue();
                            break;
                        }
                    }
                }
                if (arrayNode == null && rootNode.has("questionText")) {
                    com.fasterxml.jackson.databind.node.ArrayNode temp = objectMapper.createArrayNode();
                    temp.add(rootNode);
                    arrayNode = temp;
                }
            }

            if (arrayNode == null || !arrayNode.isArray() || arrayNode.isEmpty()) {

                throw new IllegalArgumentException("No questions found. The webpage content did not yield valid quiz items.");
            }

            List<QuizQuestionDto.CreateRequest> extracted;
            try {
                extracted = objectMapper.readValue(objectMapper.treeAsTokens(arrayNode), new TypeReference<List<QuizQuestionDto.CreateRequest>>() {});
            } catch (Exception ex) {
                System.err.println(">>> [URL EXTRACTION PIPELINE] DTO mapping failed: " + ex.getMessage());
                throw new IllegalArgumentException("Parsing failed. Could not map extracted JSON into question objects.");
            }

            if (extracted == null || extracted.isEmpty()) {
                throw new IllegalArgumentException("No questions found on this webpage.");
            }

            for (QuizQuestionDto.CreateRequest q : extracted) {
                if (q.getQuestionType() == null || q.getQuestionType().trim().isEmpty()) {
                    q.setQuestionType("MCQ");
                }
                if (q.getMarks() == null || q.getMarks() <= 0) {
                    q.setMarks(2);
                }
                if (q.getOptions() != null) {
                    for (QuizQuestionDto.Option opt : q.getOptions()) {
                        if (opt.getId() == null || opt.getId().trim().isEmpty()) {
                            opt.setId("A");
                        }
                    }
                }
            }

            System.out.println(">>> [URL EXTRACTION PIPELINE] ✔ Number of questions returned by AI: " + extracted.size());

            return extracted;
        } catch (IllegalArgumentException ie) {
            throw ie;
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("AI parsing failed to extract questions from webpage content: " + e.getMessage());
        }
    }
}

