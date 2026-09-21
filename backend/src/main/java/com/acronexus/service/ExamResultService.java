package com.acronexus.service;

import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import java.util.List;
import java.util.UUID;

public interface ExamResultService {
    ExamResultResponseDto create(ExamResultRequestDto requestDto);
    java.util.List<ExamResultResponseDto> createBulk(com.acronexus.dto.BulkExamResultRequestDto requestDto);
    ExamResultResponseDto getById(UUID id);
    List<ExamResultResponseDto> getAll();
    ExamResultResponseDto update(UUID id, ExamResultRequestDto requestDto);
    List<ExamResultResponseDto> findByExaminationAndClass(UUID examinationId, String className);
    List<ExamResultResponseDto> findByExaminationAndContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, String className);
    
    void delete(UUID id);
    void deleteResultsForClass(UUID examinationId, String className);
    void deleteResultsForContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    
    int publishResults(UUID examinationId, String className, UUID studentId);
    int publishResultsForContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, UUID studentId);
    
    List<com.acronexus.dto.PresentStudentDto> getPresentStudents(UUID examinationId, UUID classId);
    List<com.acronexus.dto.PresentStudentDto> getPresentStudentsByContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    
    byte[] exportPresentStudentsExcel(UUID examinationId, UUID classId);
    byte[] exportPresentStudentsExcelByContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    
    java.util.List<com.acronexus.dto.ExamResultContextRowDto> getResultContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    byte[] exportResultContextExcel(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    
    int bulkSaveResults(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, java.util.List<com.acronexus.dto.ExamResultContextRowDto> results);
    java.util.List<com.acronexus.dto.SavedResultContextDto> getSavedContexts(UUID examinationId);
}
