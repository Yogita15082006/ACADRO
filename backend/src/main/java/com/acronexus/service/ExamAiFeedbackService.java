package com.acronexus.service;

import com.acronexus.dto.ExamAiFeedbackRequestDto;
import com.acronexus.dto.ExamAiFeedbackResponseDto;
import java.util.List;
import java.util.UUID;

public interface ExamAiFeedbackService {
    ExamAiFeedbackResponseDto create(ExamAiFeedbackRequestDto requestDto);
    ExamAiFeedbackResponseDto getById(UUID id);
    List<ExamAiFeedbackResponseDto> getAll();
    ExamAiFeedbackResponseDto update(UUID id, ExamAiFeedbackRequestDto requestDto);
    void delete(UUID id);
    List<ExamAiFeedbackResponseDto> generateFeedbackForClass(UUID examinationId, String className);
    List<ExamAiFeedbackResponseDto> searchFeedback(UUID examinationId, String className);
}
