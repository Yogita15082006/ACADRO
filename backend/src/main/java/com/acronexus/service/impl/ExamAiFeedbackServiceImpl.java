package com.acronexus.service.impl;

import com.acronexus.dto.ExamAiFeedbackRequestDto;
import com.acronexus.dto.ExamAiFeedbackResponseDto;
import com.acronexus.dto.ai.AiAnalyticsRequest;
import com.acronexus.dto.ai.AiInsightDto;
import com.acronexus.entity.ClassSubject;
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
    public List<ExamAiFeedbackResponseDto> generateFeedbackForClass(UUID examinationId, String className, java.time.LocalDate examDate, UUID classSubjectId, List<com.acronexus.dto.ExamResultContextRowDto> unsavedRows) {
        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found: " + examinationId));
                
        boolean isUnsavedFlow = unsavedRows != null && !unsavedRows.isEmpty();
        
        List<Map<String, Object>> allResultsData = new ArrayList<>();
        List<ExamAiFeedbackResponseDto> unsavedGeneratedFeedbacks = new ArrayList<>();
        
        if (isUnsavedFlow) {
            // Unsaved Flow (Create Result / Upload)
            for (com.acronexus.dto.ExamResultContextRowDto r : unsavedRows) {
                if (r.getMarksObtained() != null) {
                    Map<String, Object> dataPayload = new HashMap<>();
                    dataPayload.put("resultId", r.getResultId() != null ? r.getResultId() : UUID.randomUUID());
                    dataPayload.put("studentId", r.getStudentId());
                    dataPayload.put("examinationName", examination.getName());
                    dataPayload.put("subject", "Subject Context");
                    dataPayload.put("subjectCode", "CODE");
                    dataPayload.put("marksObtained", r.getMarksObtained());
                    dataPayload.put("maxMarks", r.getMaxMarks());
                    
                    double percentage = 0.0;
                    if (r.getMaxMarks() != null && r.getMaxMarks().compareTo(java.math.BigDecimal.ZERO) > 0) {
                        percentage = r.getMarksObtained().doubleValue() / r.getMaxMarks().doubleValue() * 100.0;
                    }
                    dataPayload.put("percentage", String.format("%.2f%%", percentage));
                    
                    allResultsData.add(dataPayload);
                }
            }
        } else {
            // Saved Flow
            List<ExamResult> results;
            if (examDate != null && classSubjectId != null) {
                results = examResultRepository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
            } else if (className != null && !className.trim().isEmpty()) {
                results = examResultRepository.findByExaminationIdAndClassName(examinationId, className);
            } else {
                results = examResultRepository.findByExaminationId(examinationId);
            }
            
            List<ExamResult> eligibleResults = new ArrayList<>();
            for (ExamResult r : results) {
                if (r.getMarksObtained() != null) {
                    eligibleResults.add(r);
                }
            }
            
            for (ExamResult r : eligibleResults) {
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
        }
        
        if (allResultsData.isEmpty()) {
            throw new IllegalArgumentException("No eligible results with marks found for the given context.");
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
                            
                            Map<String, Object> originalData = null;
                            for (Map<String, Object> pd : batch) {
                                if (pd.get("resultId").equals(resultId)) {
                                    originalData = pd; break;
                                }
                            }
                            if (originalData == null) continue;

                            UUID studentId = (UUID) originalData.get("studentId");
                            
                            ExamAiFeedback feedback = null;
                            if (isUnsavedFlow) {
                                feedback = new ExamAiFeedback();
                            } else {
                                if (examDate != null && classSubjectId != null) {
                                    feedback = repository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(examinationId, examDate, classSubjectId, studentId)
                                            .orElse(new ExamAiFeedback());
                                } else {
                                    UUID subjId = (UUID) originalData.get("subjectId"); // Need to add this to map
                                    if (subjId != null) {
                                        feedback = repository.findByExaminationIdAndStudentIdAndSubjectId(examinationId, studentId, subjId)
                                                .orElse(new ExamAiFeedback());
                                    } else {
                                        feedback = new ExamAiFeedback();
                                    }
                                }
                            }
                                    
                            Student detachedStudent = new Student();
                            detachedStudent.setId(studentId);
                            
                            Examination detachedExam = new Examination();
                            detachedExam.setId(examinationId);

                            feedback.setExamination(detachedExam);
                            feedback.setStudent(detachedStudent);
                            feedback.setExamDate(examDate);
                            
                            if (classSubjectId != null) {
                                ClassSubject detachedClassSubject = new ClassSubject();
                                detachedClassSubject.setId(classSubjectId);
                                feedback.setClassSubject(detachedClassSubject);
                            }
                            
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
                        if (!isUnsavedFlow) {
                            repository.saveAll(feedbacksToSave);
                        }
                        
                        if (isUnsavedFlow) {
                            for (ExamAiFeedback fb : feedbacksToSave) {
                                ExamAiFeedbackResponseDto dto = new ExamAiFeedbackResponseDto();
                                dto.setId(fb.getId() != null ? fb.getId() : UUID.randomUUID());
                                dto.setStudentId(fb.getStudent().getId());
                                dto.setOverallPerformance(fb.getOverallPerformance());
                                dto.setStrengths(fb.getStrengths() != null ? fb.getStrengths() : new String[0]);
                                dto.setAreasOfImprovement(fb.getAreasOfImprovement() != null ? fb.getAreasOfImprovement() : new String[0]);
                                dto.setActionPlan(fb.getActionPlan());
                                
                                unsavedGeneratedFeedbacks.add(dto);
                            }
                        }
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
        
        if (isUnsavedFlow) {
            return unsavedGeneratedFeedbacks;
        }
        return searchFeedback(examinationId, className, examDate, classSubjectId);
    }
    
    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ExamAiFeedbackResponseDto> searchFeedback(UUID examinationId, String className, java.time.LocalDate examDate, UUID classSubjectId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.getReferenceById(userDetails.getId());

        List<ExamAiFeedback> feedbacks;
        if (currentUser.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            com.acronexus.entity.Student student = com.acronexus.config.SpringContext.getBean(com.acronexus.repository.StudentRepository.class).findByUser_Id(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("Student profile not found"));
            
            List<ExamResult> publishedResults;
            if (examDate != null && classSubjectId != null) {
                 publishedResults = examResultRepository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentIdAndIsPublishedTrue(examinationId, examDate, classSubjectId, student.getId());
            } else {
                 publishedResults = examResultRepository.findByExaminationIdAndStudentIdAndIsPublishedTrue(examinationId, student.getId());
            }
            
            if (publishedResults.isEmpty()) {
                return new ArrayList<>(); 
            }
            
            if (examDate != null && classSubjectId != null) {
                 feedbacks = repository.findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(examinationId, examDate, classSubjectId, student.getId())
                                     .map(java.util.Collections::singletonList).orElse(new ArrayList<>());
            } else {
                 feedbacks = repository.findByExaminationIdAndStudentId(examinationId, student.getId());
            }
        } else if (examDate != null && classSubjectId != null) {
            feedbacks = repository.findByExaminationIdAndExamDateAndClassSubjectId(examinationId, examDate, classSubjectId);
        } else if (className != null && !className.trim().isEmpty()) {
            feedbacks = repository.findByExaminationIdAndClassName(examinationId, className);
        } else {
            feedbacks = repository.findByExaminationId(examinationId);
        }
        return feedbacks.stream().map(mapper::toDto).collect(Collectors.toList());
    }
}
