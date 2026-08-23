package com.acronexus.service.impl;

import com.acronexus.dto.QuizAttemptDto;
import com.acronexus.dto.QuizQuestionDto;
import com.acronexus.entity.*;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.exception.UnauthorizedException;
import com.acronexus.mapper.QuizAttemptMapper;
import com.acronexus.mapper.QuizQuestionMapper;
import com.acronexus.repository.*;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.QuizAttemptService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.acronexus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizAttemptServiceImpl implements QuizAttemptService {

    private final QuizAttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final QuizAttemptMapper attemptMapper;
    private final QuizQuestionMapper questionMapper;
    private final ObjectMapper objectMapper;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final com.acronexus.service.AiService aiService;
    private final NotificationService notificationService;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        throw new UnauthorizedException("User not authenticated");
    }

    private Student getCurrentStudent() {
        User user = getCurrentUser();
        return studentRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptDto.Response> getAttemptsForQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        User user = getCurrentUser();
        if (user.getRole() == UserRole.FACULTY && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedException("You are not authorized to view attempts for this quiz");
        }

        return getFullQuizRoster(quiz);
    }

    @Override
    @Transactional
    public List<QuizQuestionDto.Response> startQuiz(UUID quizId) {
        Student student = getCurrentStudent();
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (Boolean.TRUE.equals(quiz.getIsDeleted())) {
            throw new IllegalArgumentException("Quiz has been deleted or removed by faculty");
        }

        Optional<QuizAttempt> existingAttempt = attemptRepository.findByQuiz_IdAndStudent_User_Id(quizId, student.getUser().getId());
        if (existingAttempt.isPresent() && existingAttempt.get().getCompletedAt() != null) {
            throw new IllegalArgumentException("You have already completed this quiz");
        }

        if (existingAttempt.isEmpty()) {
            QuizAttempt newAttempt = new QuizAttempt();
            newAttempt.setQuiz(quiz);
            newAttempt.setStudent(student);
            newAttempt.setStartedAt(Instant.now());
            attemptRepository.save(newAttempt);
        }

        List<QuizQuestion> questions = questionRepository.findByQuiz_Id(quizId);
        return questions.stream().map(q -> {
            QuizQuestionDto.Response dto = questionMapper.toResponseDto(q);
            // Hide correct answers from student during quiz attempt
            if (dto.getOptions() != null) {
                dto.getOptions().forEach(opt -> opt.setCorrect(false));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QuizAttemptDto.Response submitQuiz(UUID quizId, QuizAttemptDto.SubmitRequest request) {
        Student student = getCurrentStudent();
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        QuizAttempt attempt = attemptRepository.findByQuiz_IdAndStudent_User_Id(quizId, student.getUser().getId())
                .orElseGet(() -> {
                    QuizAttempt newAttempt = new QuizAttempt();
                    newAttempt.setQuiz(quiz);
                    newAttempt.setStudent(student);
                    newAttempt.setStartedAt(Instant.now().minus(java.time.Duration.ofMinutes(1)));
                    return newAttempt;
                });

        if (attempt.getCompletedAt() != null) {
            // Idempotent return if already submitted to prevent duplicate error bugs
            return attemptMapper.toResponseDto(attempt);
        }

        List<QuizQuestion> questions = questionRepository.findByQuiz_Id(quizId);
        Map<String, String> answers = request.getAnswers() != null ? request.getAnswers() : new java.util.HashMap<>();
        attempt.setSubmittedAnswers(answers);
        attempt.setCompletedAt(Instant.now());
        attempt.setIsLate(quiz.getEndTime() != null && Instant.now().isAfter(quiz.getEndTime()));

        // AUTO-DETECTION: Check if Quiz is AI Generated vs Manually Created
        boolean isAiGenerated = !"MANUAL".equalsIgnoreCase(quiz.getSourceType()) && quiz.getSourceType() != null && !quiz.getSourceType().trim().isEmpty();

        if (isAiGenerated) {
            // A) AI GENERATED QUIZ -> AUTOMATIC EVALUATION IMMEDIATELY
            int totalScore = 0;
            int correctCount = 0;
            int incorrectCount = 0;
            int unattemptedCount = 0;

            for (int i = 0; i < questions.size(); i++) {
                QuizQuestion question = questions.get(i);
                String submittedOptionId = answers.get(question.getId().toString());
                if (submittedOptionId == null) {
                    submittedOptionId = answers.get(String.valueOf(i));
                }

                if (submittedOptionId == null || submittedOptionId.trim().isEmpty()) {
                    unattemptedCount++;
                    continue;
                }

                boolean isCorrect = false;
                if ("Fill in the Blanks".equalsIgnoreCase(question.getQuestionType()) || "Short Answer".equalsIgnoreCase(question.getQuestionType())) {
                    if (question.getCorrectAnswer() != null && submittedOptionId.trim().equalsIgnoreCase(question.getCorrectAnswer().trim())) {
                        isCorrect = true;
                    } else if ("Short Answer".equalsIgnoreCase(question.getQuestionType()) && question.getCorrectAnswer() != null && !question.getCorrectAnswer().trim().isEmpty()) {
                        String studentText = submittedOptionId.trim().toLowerCase();
                        String correctText = question.getCorrectAnswer().trim().toLowerCase();
                        if (studentText.contains(correctText) || correctText.contains(studentText)) {
                            isCorrect = true;
                        }
                    }
                } else if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                    try {
                        List<QuizQuestionDto.Option> options = objectMapper.convertValue(question.getOptions(), new TypeReference<>() {});
                        if (options != null) {
                            String targetAns = submittedOptionId;
                            isCorrect = options.stream()
                                    .anyMatch(opt -> (opt.getId().equalsIgnoreCase(targetAns) || opt.getText().equalsIgnoreCase(targetAns)) && opt.isCorrect());
                        }
                    } catch (Exception ignored) {}
                } else if (question.getCorrectAnswer() != null && submittedOptionId.trim().equalsIgnoreCase(question.getCorrectAnswer().trim())) {
                    isCorrect = true;
                }

                if (isCorrect) {
                    correctCount++;
                    totalScore += (question.getMarks() != null ? question.getMarks() : 1);
                } else {
                    incorrectCount++;
                }
            }

            int passingMarks = (quiz.getPassingMarks() != null) ? quiz.getPassingMarks() : (quiz.getTotalMarks() != null ? (int) Math.ceil(quiz.getTotalMarks() * 0.4) : 0);
            int maxMarks = (quiz.getTotalMarks() != null && quiz.getTotalMarks() > 0) ? quiz.getTotalMarks() : Math.max(1, questions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1).sum());
            double pct = ((double) totalScore / maxMarks) * 100.0;
            String grade = "F";
            if (pct >= 90.0) grade = "A+";
            else if (pct >= 80.0) grade = "A";
            else if (pct >= 70.0) grade = "B+";
            else if (pct >= 60.0) grade = "B";
            else if (pct >= 50.0) grade = "C";
            else if (pct >= 40.0) grade = "D";

            attempt.setScore(new BigDecimal(totalScore));
            attempt.setPercentage(new BigDecimal(pct).setScale(2, java.math.RoundingMode.HALF_UP));
            attempt.setIsPassed(totalScore >= passingMarks);
            attempt.setGrade(grade);
            attempt.setCorrectAnswers(correctCount);
            attempt.setWrongAnswers(incorrectCount);
            attempt.setUnattemptedQuestions(unattemptedCount);
            attempt.setEvaluatedAt(Instant.now());
            attempt.setResultSummary(String.format("AI Intelligent Evaluation: %d Correct, %d Incorrect, %d Missed out of %d total questions. Score: %d/%d (%s).", correctCount, incorrectCount, unattemptedCount, questions.size(), totalScore, maxMarks, (totalScore >= passingMarks ? "PASSED" : "FAILED")));

            quiz.setIsGraded(true);
            quizRepository.save(quiz);
        } else {
            // B) MANUALLY CREATED QUIZ -> NO AUTOMATIC EVALUATION AT SUBMISSION
            attempt.setScore(null);
            attempt.setPercentage(null);
            attempt.setIsPassed(null);
            attempt.setGrade("Pending");
            attempt.setCorrectAnswers(0);
            attempt.setWrongAnswers(0);
            attempt.setUnattemptedQuestions(questions.size());
            attempt.setEvaluatedAt(null);
            attempt.setResultSummary("Manual Quiz Submission Received. Awaiting faculty review and answer key grading.");
        }

        QuizAttempt savedAttempt = attemptRepository.save(attempt);

        // Reverse Notification to Faculty
        if (quiz.getClassSubject() != null && quiz.getClassSubject().getFaculty() != null && quiz.getClassSubject().getFaculty().getUser() != null) {
            String studentName = student.getUser() != null ? student.getUser().getFirstName() + " " + (student.getUser().getLastName() != null ? student.getUser().getLastName() : "").trim() : "A student";
            notificationService.createSystemNotification(
                quiz.getClassSubject().getFaculty().getUser().getId(),
                "QUIZ",
                "Quiz Submitted",
                studentName + " submitted the quiz " + quiz.getTitle() + ".",
                savedAttempt.getId().toString()
            );
        }

        QuizAttemptDto.Response resp = attemptMapper.toResponseDto(savedAttempt);
        for (QuizAttemptDto.Response r : getFullQuizRoster(quiz)) {
            if (r.getId() != null && r.getId().equals(savedAttempt.getId())) {
                return r;
            }
        }
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptDto.Response> getStudentResults() {
        Student student = getCurrentStudent();
        List<QuizAttempt> studentAttempts = attemptRepository.findByStudent_User_Id(student.getUser().getId());
        List<QuizAttemptDto.Response> results = new java.util.ArrayList<>();
        for (QuizAttempt a : studentAttempts) {
            if (a.getCompletedAt() == null) continue;
            List<QuizAttemptDto.Response> roster = getFullQuizRoster(a.getQuiz());
            boolean found = false;
            for (QuizAttemptDto.Response r : roster) {
                if (r.getId() != null && r.getId().equals(a.getId())) {
                    results.add(r);
                    found = true;
                    break;
                }
            }
            if (!found) results.add(attemptMapper.toResponseDto(a));
        }
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptDto.Response> getAttemptsForQuizAdmin(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return getFullQuizRoster(quiz);
    }

    @Override
    @Transactional
    public QuizAttemptDto.CompleteAnalysisResponse getAttemptAnalysis(UUID attemptId) {
        User currentUser = getCurrentUser();

        // 1. Locate the attempt: try by attempt ID first, fallback to quiz ID + student ID
        QuizAttempt attempt = attemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) {
            Optional<Student> studentOpt = studentRepository.findByUser_Id(currentUser.getId());
            if (studentOpt.isPresent()) {
                attempt = attemptRepository.findByQuiz_IdAndStudent_User_Id(attemptId, currentUser.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found for id: " + attemptId));
            } else {
                List<QuizAttempt> list = attemptRepository.findByQuiz_Id(attemptId);
                if (!list.isEmpty()) {
                    attempt = list.get(0);
                } else {
                    throw new ResourceNotFoundException("Quiz attempt not found for id: " + attemptId);
                }
            }
        }

        Quiz quiz = attempt.getQuiz();
        ClassSubject cs = quiz.getClassSubject();
        Student student = attempt.getStudent();

        String subjectName = cs != null && cs.getSubject() != null ? cs.getSubject().getName() : "General Assessment";
        String facultyName = cs != null && cs.getFaculty() != null && cs.getFaculty().getUser() != null ?
                (cs.getFaculty().getUser().getFirstName() + " " + cs.getFaculty().getUser().getLastName()).trim() :
                (quiz.getCreatedBy() != null ? (quiz.getCreatedBy().getFirstName() + " " + quiz.getCreatedBy().getLastName()).trim() : "Faculty");
        String className = "Assigned Section";
        if (cs != null && cs.getAcroClass() != null) {
            String baseName = (cs.getAcroClass().getName() != null && !cs.getAcroClass().getName().equalsIgnoreCase("null")) ? cs.getAcroClass().getName().trim() : "";
            String sec = (cs.getAcroClass().getSection() != null && !cs.getAcroClass().getSection().equalsIgnoreCase("null") && !cs.getAcroClass().getSection().trim().isEmpty()) ? cs.getAcroClass().getSection().trim() : "";
            if (!baseName.isEmpty() && !sec.isEmpty()) {
                className = baseName + " - " + sec;
            } else if (!baseName.isEmpty()) {
                className = baseName;
            } else if (!sec.isEmpty()) {
                className = sec;
            }
        }

        // 2. Fetch Questions and parse answers
        List<QuizQuestion> questions = questionRepository.findByQuiz_Id(quiz.getId());
        Map<String, String> answers = attempt.getSubmittedAnswers() != null ? attempt.getSubmittedAnswers() : new java.util.HashMap<>();

        List<QuizAttemptDto.QuestionReviewDto> questionReviews = new java.util.ArrayList<>();
        int computedCorrect = 0;
        int computedIncorrect = 0;
        int computedUnattempted = 0;

        for (int i = 0; i < questions.size(); i++) {
            QuizQuestion q = questions.get(i);
            String ansKey = q.getId() != null ? q.getId().toString() : String.valueOf(i);
            String submittedOptionId = answers.get(ansKey);
            if (submittedOptionId == null) {
                submittedOptionId = answers.get(String.valueOf(i));
            }

            int maxMarks = q.getMarks() != null && q.getMarks() > 0 ? q.getMarks() : 1;
            String correctAnswerText = q.getCorrectAnswer() != null ? q.getCorrectAnswer().trim() : "Not Specified";
            String studentAnswerText = submittedOptionId != null && !submittedOptionId.trim().isEmpty() ? submittedOptionId.trim() : "Not Attempted";
            boolean isCorrect = false;
            String status = "unanswered";
            int marksAwarded = 0;

            if (submittedOptionId == null || submittedOptionId.trim().isEmpty()) {
                computedUnattempted++;
                status = "unanswered";
            } else {
                if ("Fill in the Blanks".equalsIgnoreCase(q.getQuestionType()) || "Short Answer".equalsIgnoreCase(q.getQuestionType())) {
                    if (q.getCorrectAnswer() != null && submittedOptionId.trim().equalsIgnoreCase(q.getCorrectAnswer().trim())) {
                        isCorrect = true;
                    } else if ("Short Answer".equalsIgnoreCase(q.getQuestionType()) && q.getCorrectAnswer() != null && !q.getCorrectAnswer().trim().isEmpty()) {
                        String studentText = submittedOptionId.trim().toLowerCase();
                        String correctText = q.getCorrectAnswer().trim().toLowerCase();
                        if (studentText.contains(correctText) || correctText.contains(studentText)) {
                            isCorrect = true;
                        }
                    }
                } else if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                    try {
                        List<QuizQuestionDto.Option> options = objectMapper.convertValue(q.getOptions(), new TypeReference<>() {});
                        if (options != null) {
                            String targetAns = submittedOptionId;
                            for (QuizQuestionDto.Option opt : options) {
                                if (opt.isCorrect()) {
                                    correctAnswerText = opt.getId().toUpperCase() + ". " + opt.getText();
                                }
                                if (opt.getId().equalsIgnoreCase(targetAns) || opt.getText().equalsIgnoreCase(targetAns)) {
                                    studentAnswerText = opt.getId().toUpperCase() + ". " + opt.getText();
                                    if (opt.isCorrect()) {
                                        isCorrect = true;
                                    }
                                }
                            }
                            if (!isCorrect && options.stream().anyMatch(opt -> opt.getText().equalsIgnoreCase(targetAns) && opt.isCorrect())) {
                                isCorrect = true;
                            }
                        }
                    } catch (Exception ignored) {}
                } else if (q.getCorrectAnswer() != null && submittedOptionId.trim().equalsIgnoreCase(q.getCorrectAnswer().trim())) {
                    isCorrect = true;
                }

                if (isCorrect) {
                    computedCorrect++;
                    status = "correct";
                    marksAwarded = maxMarks;
                } else {
                    computedIncorrect++;
                    status = "incorrect";
                    marksAwarded = 0;
                }
            }

            questionReviews.add(QuizAttemptDto.QuestionReviewDto.builder()
                    .questionNumber(i + 1)
                    .questionId(q.getId())
                    .questionText(q.getQuestionText() != null ? q.getQuestionText() : "Question " + (i + 1))
                    .questionType(q.getQuestionType() != null ? q.getQuestionType() : "MCQ")
                    .studentAnswer(studentAnswerText)
                    .correctAnswer(correctAnswerText)
                    .marksAwarded(marksAwarded)
                    .maximumMarks(maxMarks)
                    .status(status)
                    .options(q.getOptions())
                    .explanation(q.getExplanation())
                    .aiExplanation(q.getAiExplanation())
                    .build());
        }

        int totalQuestionsCount = questions.size();
        int finalCorrect = attempt.getCorrectAnswers() != null ? attempt.getCorrectAnswers() : computedCorrect;
        int finalIncorrect = attempt.getWrongAnswers() != null ? attempt.getWrongAnswers() : computedIncorrect;
        int finalUnattempted = attempt.getUnattemptedQuestions() != null ? attempt.getUnattemptedQuestions() : computedUnattempted;
        int attemptedCount = finalCorrect + finalIncorrect;

        BigDecimal accuracyPct = attemptedCount > 0 ?
                new BigDecimal(((double) finalCorrect / attemptedCount) * 100.0).setScale(2, java.math.RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        int totalM = quiz.getTotalMarks() != null && quiz.getTotalMarks() > 0 ? quiz.getTotalMarks() : Math.max(1, questions.stream().mapToInt(q -> q.getMarks() != null && q.getMarks() > 0 ? q.getMarks() : 1).sum());
        int passingM = quiz.getPassingMarks() != null ? quiz.getPassingMarks() : (int) Math.ceil(totalM * 0.4);
        BigDecimal obtM = attempt.getScore() != null ? attempt.getScore() : new BigDecimal(questionReviews.stream().mapToInt(QuizAttemptDto.QuestionReviewDto::getMarksAwarded).sum());
        BigDecimal pct = attempt.getPercentage() != null ? attempt.getPercentage() : new BigDecimal(((double) obtM.doubleValue() / totalM) * 100.0).setScale(2, java.math.RoundingMode.HALF_UP);
        boolean passed = attempt.getIsPassed() != null ? attempt.getIsPassed() : (obtM.doubleValue() >= passingM || pct.doubleValue() >= 40.0);
        String grade = attempt.getGrade() != null && !"Pending".equalsIgnoreCase(attempt.getGrade()) ? attempt.getGrade() : (passed ? "Passed" : "Failed");

        // Time taken calculation
        long durationSecs = 0;
        if (attempt.getStartedAt() != null && attempt.getCompletedAt() != null) {
            durationSecs = java.time.Duration.between(attempt.getStartedAt(), attempt.getCompletedAt()).getSeconds();
        } else if (quiz.getDurationMinutes() != null) {
            durationSecs = quiz.getDurationMinutes() * 60L;
        }
        long mins = durationSecs / 60;
        long secs = durationSecs % 60;
        String timeTakenStr = mins > 0 ? String.format("%d min %d sec", mins, secs) : String.format("%d sec", Math.max(1, secs));
        int durationM = quiz.getDurationMinutes() != null ? quiz.getDurationMinutes() : (int) Math.max(1, mins);

        // 3. Class Rank & Class Performance (Standard Competition Ranking 1, 1, 3, 4)
        List<QuizAttemptDto.Response> roster = getFullQuizRoster(quiz);
        int totalStudentsInClass = roster.isEmpty() ? 1 : (roster.get(0).getTotalStudents() != null ? roster.get(0).getTotalStudents() : 1);
        
        int studentRank = 1;
        BigDecimal sumScores = BigDecimal.ZERO;
        int evalCount = 0;
        BigDecimal highestM = obtM;
        BigDecimal lowestM = obtM;

        for (QuizAttemptDto.Response r : roster) {
            if (r.getCompletedAt() != null && r.getScore() != null && !"--".equals(r.getGrade()) && !"Pending".equalsIgnoreCase(r.getGrade())) {
                BigDecimal s = r.getScore();
                sumScores = sumScores.add(s);
                if (evalCount == 0) {
                    highestM = s;
                    lowestM = s;
                } else {
                    if (s.compareTo(highestM) > 0) highestM = s;
                    if (s.compareTo(lowestM) < 0) lowestM = s;
                }
                evalCount++;
                if (r.getStudentId() != null && student != null && r.getStudentId().equals(student.getId()) && r.getClassRank() != null) {
                    studentRank = r.getClassRank();
                }
            }
        }

        BigDecimal classAvg = evalCount == 0 ? obtM : sumScores.divide(new BigDecimal(evalCount), 2, java.math.RoundingMode.HALF_UP);

        double percentileVal = roster.isEmpty() ? 100.0 :
                (((double) (totalStudentsInClass - studentRank)) / totalStudentsInClass) * 100.0;
        if (studentRank == 1 || percentileVal < 0) percentileVal = Math.min(100.0, Math.max(0.0, percentileVal));
        if (studentRank == 1 && totalStudentsInClass > 0) percentileVal = 100.0;
        BigDecimal studentPercentile = new BigDecimal(percentileVal).setScale(1, java.math.RoundingMode.HALF_UP);

        // 4. Performance Trend (Historical comparison across student's attempts)
        List<QuizAttempt> studentAttempts = attemptRepository.findByStudent_User_Id(student.getUser().getId()).stream()
                .filter(a -> a.getCompletedAt() != null && a.getPercentage() != null)
                .sorted(java.util.Comparator.comparing(QuizAttempt::getCompletedAt))
                .collect(Collectors.toList());

        List<QuizAttemptDto.TrendDataPoint> trendPoints = new java.util.ArrayList<>();
        for (int i = 0; i < studentAttempts.size(); i++) {
            QuizAttempt a = studentAttempts.get(i);
            trendPoints.add(QuizAttemptDto.TrendDataPoint.builder()
                    .name("Attempt " + (i + 1))
                    .score(a.getPercentage())
                    .quizTitle(a.getQuiz() != null ? a.getQuiz().getTitle() : "Quiz " + (i + 1))
                    .build());
        }
        if (trendPoints.isEmpty()) {
            trendPoints.add(QuizAttemptDto.TrendDataPoint.builder()
                    .name("Attempt 1")
                    .score(pct)
                    .quizTitle(quiz.getTitle())
                    .build());
        }

        // 5. Groq AI Performance Analysis (Cached in DB to ensure fast repeat loading)
        QuizAttemptDto.AiPerformanceAnalysisDto aiAnalysisDto = null;
        String aiRankInsightsStr = null;

        if (attempt.getAiAnalysisJson() != null && !attempt.getAiAnalysisJson().trim().isEmpty()) {
            try {
                Map<String, String> cachedMap = objectMapper.readValue(attempt.getAiAnalysisJson(), new TypeReference<>() {});
                aiAnalysisDto = QuizAttemptDto.AiPerformanceAnalysisDto.builder()
                        .summary(cachedMap.get("summary"))
                        .strongTopics(cachedMap.get("strongTopics"))
                        .weakTopics(cachedMap.get("weakTopics"))
                        .frequentlyMissedConcepts(cachedMap.get("frequentlyMissedConcepts"))
                        .improvementSuggestions(cachedMap.get("improvementSuggestions"))
                        .learningRecommendations(cachedMap.get("learningRecommendations"))
                        .difficultyAnalysis(cachedMap.get("difficultyAnalysis"))
                        .studyStrategy(cachedMap.get("studyStrategy"))
                        .build();
                aiRankInsightsStr = cachedMap.get("aiRankInsights");
            } catch (Exception e) {
                aiAnalysisDto = null;
            }
        }

        if (aiAnalysisDto == null) {
            StringBuilder qBuilder = new StringBuilder();
            for (QuizAttemptDto.QuestionReviewDto rev : questionReviews) {
                qBuilder.append(String.format("Q%d [%s, %s]: Text: '%s', Student Ans: '%s', Correct Ans: '%s', Status: %s, Marks: %d/%d\n",
                        rev.getQuestionNumber(), rev.getQuestionType(), quiz.getDifficulty(),
                        rev.getQuestionText(), rev.getStudentAnswer(), rev.getCorrectAnswer(),
                        rev.getStatus().toUpperCase(), rev.getMarksAwarded(), rev.getMaximumMarks()));
            }

            String prompt = String.format(
                    "You are an expert academic evaluator and professor powered by advanced AI. Conduct an in-depth academic performance analysis for student '%s' (Enrollment: %s) on the quiz '%s' in subject '%s' (Faculty: %s).\n" +
                    "Performance Profile:\n- Marks: %s / %s (Percentage: %s%%, Grade: %s, Result: %s)\n" +
                    "- Duration Allowed: %d min, Time Taken: %s\n" +
                    "- Class Rank: #%d out of %d students (Class Avg: %s)\n" +
                    "- Breakdown: %d Correct, %d Incorrect, %d Unattempted (Accuracy: %s%%)\n\n" +
                    "Question-by-Question Interaction History:\n%s\n\n" +
                    "INSTRUCTIONS:\n" +
                    "Analyze the student's real performance data above to identify underlying subject competencies and knowledge gaps. DO NOT use placeholder text or generic templates.\n" +
                    "You MUST respond ONLY with a valid JSON object matching exactly the following keys (all values must be descriptive strings without nested objects):\n" +
                    "{\n" +
                    "  \"summary\": \"Comprehensive evaluation of total score, accuracy efficiency, and exam readiness\",\n" +
                    "  \"strongTopics\": \"Identify concepts and topics mastered based on correct questions\",\n" +
                    "  \"weakTopics\": \"Identify concepts where conceptual faults or calculation errors occurred\",\n" +
                    "  \"frequentlyMissedConcepts\": \"Highlight underlying patterns in incorrect or unanswered items\",\n" +
                    "  \"improvementSuggestions\": \"Provide specific corrective actions and techniques to overcome weak areas\",\n" +
                    "  \"learningRecommendations\": \"Recommended learning materials, practice methodologies, and study habits\",\n" +
                    "  \"difficultyAnalysis\": \"Analysis of how effectively the student handled conceptual rigor and time constraints\",\n" +
                    "  \"studyStrategy\": \"Actionable, step-by-step revision workflow and prep schedule for the upcoming examination\",\n" +
                    "  \"aiRankInsights\": \"Competitive cohort standing analysis (#%d of %d in %s) with strategic guidance to achieve top percentile ranking\"\n" +
                    "}",
                    student.getUser().getFirstName() + " " + student.getUser().getLastName(),
                    student.getEnrollmentNo() != null ? student.getEnrollmentNo() : "N/A",
                    quiz.getTitle(), subjectName, facultyName,
                    obtM, totalM, pct, grade, passed ? "PASSED" : "FAILED",
                    durationM, timeTakenStr, studentRank, totalStudentsInClass, classAvg,
                    finalCorrect, finalIncorrect, finalUnattempted, accuracyPct,
                    qBuilder.toString(),
                    studentRank, totalStudentsInClass, className
            );

            try {
                com.acronexus.dto.ai.AiGenericResponse aiResp = aiService.generateContent(
                        com.acronexus.dto.ai.AiGenericRequest.builder().userPrompt(prompt).maxTokens(2000).temperature(0.3).build());
                String rawAi = aiResp != null ? aiResp.getContent() : null;
                if (rawAi != null) {
                    int jsonStart = rawAi.indexOf("{");
                    int jsonEnd = rawAi.lastIndexOf("}");
                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                        rawAi = rawAi.substring(jsonStart, jsonEnd + 1);
                    }
                    Map<String, String> resultMap = objectMapper.readValue(rawAi, new TypeReference<>() {});
                    aiAnalysisDto = QuizAttemptDto.AiPerformanceAnalysisDto.builder()
                            .summary(resultMap.get("summary"))
                            .strongTopics(resultMap.get("strongTopics"))
                            .weakTopics(resultMap.get("weakTopics"))
                            .frequentlyMissedConcepts(resultMap.get("frequentlyMissedConcepts"))
                            .improvementSuggestions(resultMap.get("improvementSuggestions"))
                            .learningRecommendations(resultMap.get("learningRecommendations"))
                            .difficultyAnalysis(resultMap.get("difficultyAnalysis"))
                            .studyStrategy(resultMap.get("studyStrategy"))
                            .build();
                    aiRankInsightsStr = resultMap.get("aiRankInsights");

                    attempt.setAiAnalysisJson(objectMapper.writeValueAsString(resultMap));
                    attemptRepository.save(attempt);
                }
            } catch (Exception ex) {
                String fallbackSummary = String.format("Student scored %s/%s (%s%%) with an accuracy of %s%% across %d attempted questions.", obtM, totalM, pct, accuracyPct, attemptedCount);
                aiAnalysisDto = QuizAttemptDto.AiPerformanceAnalysisDto.builder()
                        .summary(fallbackSummary)
                        .strongTopics(finalCorrect > 0 ? String.format("Successfully demonstrated core proficiency in %d correct items across %s.", finalCorrect, subjectName) : "Further structured conceptual review is recommended.")
                        .weakTopics(finalIncorrect > 0 ? String.format("Encountered challenges in %d questions. Focused revision of incorrect problem types is advised.", finalIncorrect) : "No incorrect answers identified among attempted items.")
                        .frequentlyMissedConcepts(finalUnattempted > 0 ? String.format("Skipped %d questions during assessment time window.", finalUnattempted) : "Successfully engaged with all presented questions.")
                        .improvementSuggestions("Review individual question rationale in the review section and consult lecture notes for missed items.")
                        .learningRecommendations(String.format("Prioritize targeted %s problem sets with self-timed assessments.", subjectName))
                        .difficultyAnalysis(String.format("Assessment difficulty rate: %s. Completed within %s.", quiz.getDifficulty() != null ? quiz.getDifficulty() : "Standard", timeTakenStr))
                        .studyStrategy("1. Conduct deep-dive review of course notes on missed topics.\n2. Complete supplementary practice problem sets.\n3. Verify conceptual understanding against official faculty answer keys.")
                        .build();
                aiRankInsightsStr = String.format("Current standing: Rank #%d of %d in %s (%.1f%% percentile), relative to class average of %s.", studentRank, totalStudentsInClass, className, studentPercentile.doubleValue(), classAvg);
            }
        }

        QuizAttemptDto.ClassPerformanceDto classPerformanceDto = QuizAttemptDto.ClassPerformanceDto.builder()
                .classRank(studentRank)
                .totalStudents(totalStudentsInClass)
                .studentMarks(obtM)
                .highestMarks(highestM)
                .lowestMarks(lowestM)
                .classAverage(classAvg)
                .studentPercentile(studentPercentile)
                .aiRankInsights(aiRankInsightsStr != null ? aiRankInsightsStr : String.format("Rank #%d of %d in %s assessment.", studentRank, totalStudentsInClass, subjectName))
                .build();

        return QuizAttemptDto.CompleteAnalysisResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .subjectName(subjectName)
                .facultyName(facultyName)
                .questionType(quiz.getQuestionType() != null ? (quiz.getQuestionType().equalsIgnoreCase("True/False") ? "True / False" : quiz.getQuestionType()) : "MCQ")
                .difficulty(quiz.getDifficulty() != null ? quiz.getDifficulty() : "Standard")
                .className(className)
                .totalQuestions(totalQuestionsCount)
                .attemptedQuestions(attemptedCount)
                .unattemptedQuestions(finalUnattempted)
                .correctAnswers(finalCorrect)
                .incorrectAnswers(finalIncorrect)
                .accuracyPercentage(accuracyPct)
                .totalMarks(new BigDecimal(totalM))
                .marksObtained(obtM)
                .passingMarks(passingM)
                .percentage(pct)
                .passed(passed)
                .grade(grade)
                .durationMinutes(durationM)
                .startedAt(attempt.getStartedAt() != null ? attempt.getStartedAt() : attempt.getCompletedAt())
                .submittedAt(attempt.getCompletedAt() != null ? attempt.getCompletedAt() : Instant.now())
                .timeTakenFormatted(timeTakenStr)
                .classPerformance(classPerformanceDto)
                .aiAnalysis(aiAnalysisDto)
                .questionReviews(questionReviews)
                .performanceTrend(trendPoints)
                .build();
    }

    private List<QuizAttemptDto.Response> getFullQuizRoster(Quiz quiz) {
        if (quiz == null) return new java.util.ArrayList<>();
        List<QuizAttempt> dbAttempts = attemptRepository.findByQuiz_Id(quiz.getId());
        java.util.Map<UUID, QuizAttemptDto.Response> rosterMap = new java.util.LinkedHashMap<>();
        for (QuizAttempt att : dbAttempts) {
            QuizAttemptDto.Response dto = attemptMapper.toResponseDto(att);
            if (dto != null && dto.getStudentId() != null) {
                rosterMap.put(dto.getStudentId(), dto);
            }
        }
        if (quiz.getClassSubject() != null && quiz.getClassSubject().getAcroClass() != null) {
            List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(quiz.getClassSubject().getAcroClass().getId());
            int defaultTotalM = quiz.getTotalMarks() != null && quiz.getTotalMarks() > 0 ? quiz.getTotalMarks() : 100;
            for (StudentEnrollment se : enrollments) {
                Student s = se.getStudent();
                if (s != null && !rosterMap.containsKey(s.getId())) {
                    User u = s.getUser();
                    String studentName = "Student Account";
                    String profilePic = null;
                    if (u != null) {
                        String fname = u.getFirstName() != null ? u.getFirstName() : "";
                        String lname = u.getLastName() != null ? u.getLastName() : "";
                        String full = (fname + " " + lname).trim();
                        if (!full.isEmpty()) studentName = full;
                        profilePic = u.getProfilePictureUrl();
                    }
                    String studentAvatar = (profilePic != null && !profilePic.trim().isEmpty()) ? profilePic : "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(studentName, java.nio.charset.StandardCharsets.UTF_8) + "&background=4F46E5&color=fff";

                    QuizAttemptDto.Response unattemptedDto = QuizAttemptDto.Response.builder()
                            .id(s.getId())
                            .quizId(quiz.getId())
                            .quizTitle(quiz.getTitle() != null ? quiz.getTitle() : "Assessment")
                            .studentId(s.getId())
                            .studentName(studentName)
                            .studentEnrollmentNumber(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "N/A")
                            .studentProfilePictureUrl(profilePic)
                            .studentAvatar(studentAvatar)
                            .score(null)
                            .totalMarks(defaultTotalM)
                            .percentage(null)
                            .passed(null)
                            .grade("--")
                            .isLate(false)
                            .correctAnswers(0)
                            .wrongAnswers(0)
                            .unattemptedQuestions(0)
                            .resultSummary("No submission recorded yet.")
                            .startedAt(null)
                            .completedAt(null)
                            .evaluatedAt(null)
                            .submittedAnswers(new java.util.HashMap<>())
                            .build();
                    rosterMap.put(s.getId(), unattemptedDto);
                }
            }
        }

        List<QuizAttemptDto.Response> roster = new java.util.ArrayList<>(rosterMap.values());
        int totalStudents = Math.max(1, roster.size());
        boolean deadlineExpired = quiz.getEndTime() != null && Instant.now().isAfter(quiz.getEndTime());

        for (QuizAttemptDto.Response r : roster) {
            r.setTotalStudents(totalStudents);
            r.setIsLate(false);
            if (r.getCompletedAt() != null) {
                r.setSubmissionStatus("Submitted");
            } else {
                r.setSubmissionStatus(deadlineExpired ? "Not Attempted" : "Pending");
            }
            if (r.getScore() == null && (r.getGrade() == null || "Pending".equalsIgnoreCase(r.getGrade()))) {
                r.setGrade("--");
            }
        }

        List<QuizAttemptDto.Response> evaluatedList = roster.stream()
                .filter(r -> r.getCompletedAt() != null && r.getScore() != null && r.getGrade() != null && !"Pending".equalsIgnoreCase(r.getGrade()) && !"--".equalsIgnoreCase(r.getGrade()))
                .sorted((r1, r2) -> r2.getScore().compareTo(r1.getScore()))
                .collect(Collectors.toList());

        int currentRank = 1;
        BigDecimal prevScore = null;
        for (int i = 0; i < evaluatedList.size(); i++) {
            QuizAttemptDto.Response item = evaluatedList.get(i);
            if (prevScore != null && item.getScore().compareTo(prevScore) != 0) {
                currentRank = i + 1;
            }
            prevScore = item.getScore();
            item.setClassRank(currentRank);
            item.setRank(currentRank);
        }

        roster.sort((r1, r2) -> (r1.getStudentName() != null ? r1.getStudentName() : "").compareToIgnoreCase(r2.getStudentName() != null ? r2.getStudentName() : ""));
        return roster;
    }
}
