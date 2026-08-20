package com.acronexus.service;

import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import java.util.List;
import java.util.UUID;

public interface ExamResultService {
    ExamResultResponseDto create(ExamResultRequestDto requestDto);
    ExamResultResponseDto getById(UUID id);
    List<ExamResultResponseDto> getAll();
    ExamResultResponseDto update(UUID id, ExamResultRequestDto requestDto);
    List<ExamResultResponseDto> findByExaminationAndClass(UUID examinationId, String className);
    void delete(UUID id);
    void deleteResultsForClass(UUID examinationId, String className);
    int publishResults(UUID examinationId, String className, UUID studentId);
}
