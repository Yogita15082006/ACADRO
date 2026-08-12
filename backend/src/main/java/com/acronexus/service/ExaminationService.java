package com.acronexus.service;

import com.acronexus.dto.ExaminationRequestDto;
import com.acronexus.dto.ExaminationResponseDto;
import java.util.List;
import java.util.UUID;

public interface ExaminationService {
    ExaminationResponseDto create(ExaminationRequestDto requestDto);
    ExaminationResponseDto getById(UUID id);
    List<ExaminationResponseDto> getAll();
    ExaminationResponseDto update(UUID id, ExaminationRequestDto requestDto);
    void delete(UUID id);
    ExaminationResponseDto uploadTimetable(UUID id, org.springframework.web.multipart.MultipartFile file);
    void deleteTimetable(UUID examId, UUID timetableId);
    org.springframework.http.ResponseEntity<byte[]> downloadTimetable(UUID examId, UUID timetableId);
    List<com.acronexus.dto.ExaminationEligibilityMetricsDto> getEligibilityMetrics(UUID id);
    java.util.List<com.acronexus.dto.ExaminationEligibilityStudentDto> generateEligibilityList(UUID id, com.acronexus.dto.EligibilityGenerationRequestDto request);
    java.util.List<com.acronexus.dto.ExaminationEligibilityListDto> saveEligibilityList(UUID id, com.acronexus.dto.ExaminationEligibilityListDto request);
    List<com.acronexus.dto.ExaminationEligibilityListDto> getEligibilityList(UUID id);
    void deleteEligibilityList(UUID examId, UUID listId);
}
