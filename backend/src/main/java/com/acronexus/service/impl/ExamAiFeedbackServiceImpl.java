package com.acronexus.service.impl;

import com.acronexus.dto.ExamAiFeedbackRequestDto;
import com.acronexus.dto.ExamAiFeedbackResponseDto;
import com.acronexus.dto.ai.AiAnalyticsRequest;
import com.acronexus.dto.ai.AiInsightDto;
import com.acronexus.entity.ExamAiFeedback;
import com.acronexus.entity.ExamResult;
import com.acronexus.entity.Examination;
import com.acronexus.entity.Student;
import com.acronexus.entity.Subject;
import com.acronexus.entity.User;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ExamAiFeedbackMapper;
import com.acronexus.repository.ExamAiFeedbackRepository;
import com.acronexus.repository.ExamResultRepository;
import com.acronexus.repository.ExaminationRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.AiService;
import com.acronexus.service.ExamAiFeedbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class ExamAiFeedbackServiceImpl implements ExamAiFeedbackService {

    private final ExamAiFeedbackRepository repository;
    private final ExamAiFeedbackMapper mapper;
    private final ExamResultRepository examResultRepository;
    private final ExaminationRepository examinationRepository;
    private final UserRepository userRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    @Transactional
    public ExamAiFeedbackResponseDto create(ExamAiFeedbackRequestDto requestDto) {
        ExamAiFeedback entity = mapper.toEntity(requestDto);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ExamAiFeedbackResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAiFeedback not found with id: " + id));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ExamAiFeedbackResponseDto> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExamAiFeedbackResponseDto update(UUID id, ExamAiFeedbackRequestDto requestDto) {
        ExamAiFeedback entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAiFeedback not found with id: " + id));
        // Update fields based on requestDto
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ExamAiFeedback not found with id: " + id);
        }
        repository.deleteById(id);
    }
    
    @Override
    @Transactional
    public List<ExamAiFeedbackResponseDto> generateFeedbackForClass(UUID examinationId, String className) {
        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found: " + examinationId));
                
        List<ExamResult> results;
        if (className != null && !className.trim().isEmpty()) {
            results = examResultRepository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            results = examResultRepository.findByExaminationId(examinationId);
        }
        
        if (results.isEmpty()) {
            throw new IllegalArgumentException("No results found for the given examination and class");
        }
        
        List<Map<String, Object>> allResultsData = new ArrayList<>();
        
        for (ExamResult r : results) {
            Map<String, Object> dataPayload = new HashMap<>();
            dataPayload.put("resultId", r.getId());
            dataPayload.put("studentId", r.getStudent().getId());
            dataPayload.put("examinationName", examination.getName());
            dataPayload.put("subject", r.getSubject().getName());
            dataPayload.put("subjectCode", r.getSubject().getCode());
            dataPayload.put("marksObtained", r.getMarksObtained());
            dataPayload.put("maxMarks", r.getMaxMarks());
            
            double percentage = 0.0;
            if (r.getMaxMarks() != null && r.getMaxMarks().compareTo(java.math.BigDecimal.ZERO) > 0) {
                percentage = r.getMarksObtained().doubleValue() / r.getMaxMarks().doubleValue() * 100.0;
            }
            dataPayload.put("percentage", String.format("%.2f%%", percentage));
            
            allResultsData.add(dataPayload);
        }
        
        try {
            int batchSize = 10; // Process 10 students at a time sequentially for faster overall generation without hitting rate limits
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            
            for (int i = 0; i < allResultsData.size(); i += batchSize) {
                int start = i;
                int end = Math.min(start + batchSize, allResultsData.size());
                java.util.List<Map<String, Object>> batch = allResultsData.subList(start, end);
                    Map<String, Object> bulkPayload = new HashMap<>();
                    bulkPayload.put("results", batch);
                    
                    AiAnalyticsRequest request = new AiAnalyticsRequest();
                    request.setInsightType("BULK_EXAM_FEEDBACK");
                    request.setData(bulkPayload);
                    
                    log.info("Sending BULK_EXAM_FEEDBACK request for students {} to {}", start, end - 1);
                    AiInsightDto insightDto = aiService.getInsights(request);
                    
                    if (insightDto.getRawInsights() == null || insightDto.getRawInsights().isEmpty() || insightDto.getRawInsights().equals("[]") || insightDto.getRawInsights().equals("{}")) {
                        log.warn("AI Service returned empty rawInsights for batch {} to {}. Reasoning: {}", start, end - 1, insightDto.getReasoning());
                        continue;
                    }
                    
                    try {
                        com.fasterxml.jackson.databind.JsonNode jsonArray = mapper.readTree(insightDto.getRawInsights());
                        if (!jsonArray.isArray()) {
                            log.warn("AI Service returned invalid rawInsights format for batch {} to {}. Expected JSON array.", start, end - 1);
                            continue;
                        }
                        
                        java.util.List<ExamAiFeedback> feedbacksToSave = new ArrayList<>();
                        for (com.fasterxml.jackson.databind.JsonNode node : jsonArray) {
                            if (!node.has("resultId")) continue;
                            
                            String resultIdStr = node.get("resultId").asText();
                            UUID resultId = UUID.fromString(resultIdStr);
                            
                            ExamResult examResult = examResultRepository.findById(resultId).orElse(null);
                            if(examResult == null) continue;

                            UUID studentId = examResult.getStudent().getId();
                            UUID subjectId = examResult.getSubject().getId();
                            
                            ExamAiFeedback feedback = repository.findByExaminationIdAndStudentIdAndSubjectId(examinationId, studentId, subjectId)
                                    .orElse(new ExamAiFeedback());
                                    
                            Student detachedStudent = new Student();
                            detachedStudent.setId(studentId);
                            
                            Examination detachedExam = new Examination();
                            detachedExam.setId(examinationId);

                            Subject detachedSubject = new Subject();
                            detachedSubject.setId(subjectId);
                                    
                            feedback.setExamination(detachedExam);
                            feedback.setStudent(detachedStudent);
                            feedback.setSubject(detachedSubject);
                            
                            String reasoning = node.has("reasoning") ? node.get("reasoning").asText() : "Analysis completed.";
                            feedback.setOverallPerformance(reasoning);
                            
                            List<String> strengths = new ArrayList<>();
                            List<String> weaknesses = new ArrayList<>();
                            
                            if (node.has("recommendations") && node.get("recommendations").isArray()) {
                                for (com.fasterxml.jackson.databind.JsonNode recNode : node.get("recommendations")) {
                                    String insight = recNode.asText();
                                    if (insight.toLowerCase().contains("strength") || insight.toLowerCase().contains("good") || insight.toLowerCase().contains("excellent") || insight.toLowerCase().contains("keep it up")) {
                                        strengths.add(insight);
                                    } else {
                                        weaknesses.add(insight);
                                    }
                                }
                            }
                            
                            feedback.setStrengths(strengths.toArray(new String[0]));
                            feedback.setAreasOfImprovement(weaknesses.toArray(new String[0]));
                            
                            if (!weaknesses.isEmpty()) {
                                feedback.setActionPlan(String.join("\n", weaknesses));
                            } else if (!strengths.isEmpty() && weaknesses.isEmpty()) {
                                feedback.setActionPlan(String.join("\n", strengths)); // fallback
                            } else {
                                feedback.setActionPlan("Review your performance and continue consistent study habits.");
                            }
                            
                            feedbacksToSave.add(feedback);
                        }
                        repository.saveAll(feedbacksToSave);                        
                    } catch (Exception e) {
                        log.error("Error parsing AI response for batch {} to {}", start, end - 1, e);
                    }
                    
                    // Add a small delay between batches to respect rate limits
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
            } // end for loop
                
        } catch (Exception e) {
            log.error("Failed to process bulk AI feedback for class " + className, e);
            throw new RuntimeException("AI bulk generation failed: " + e.getMessage(), e);
        }
        
        return searchFeedback(examinationId, className);
    }
    
    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ExamAiFeedbackResponseDto> searchFeedback(UUID examinationId, String className) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.getReferenceById(userDetails.getId());

        List<ExamAiFeedback> feedbacks;
        if (currentUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            // Check if they have at least one published result for this exam
            List<ExamResult> publishedResults = examResultRepository.findByExaminationIdAndStudentIdAndIsPublishedTrue(examinationId, currentUser.getId());
            if (publishedResults.isEmpty()) {
                return new ArrayList<>(); // Do not return feedback if results are not published
            }
            feedbacks = repository.findByExaminationIdAndStudentId(examinationId, currentUser.getId());
        } else if (className != null && !className.trim().isEmpty()) {
            feedbacks = repository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            feedbacks = repository.findByExaminationId(examinationId);
        }
        return feedbacks.stream().map(mapper::toDto).collect(Collectors.toList());
    }
}
