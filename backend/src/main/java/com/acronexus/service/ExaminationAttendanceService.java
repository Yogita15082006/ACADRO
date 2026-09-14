package com.acronexus.service;

import com.acronexus.dto.ExaminationAttendanceDto;
import com.acronexus.dto.ExaminationAttendanceSaveRequestDto;

import java.util.List;
import java.util.UUID;

public interface ExaminationAttendanceService {
    List<ExaminationAttendanceDto> getAttendanceForExamination(UUID examinationId);
    List<com.acronexus.dto.ExaminationAttendanceSubjectDto> getAttendanceForClassSubject(UUID classSubjectId);
    void saveAttendanceForExamination(UUID examinationId, ExaminationAttendanceSaveRequestDto requestDto);
    void deleteAttendanceContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    List<java.time.LocalDate> getAvailableAttendanceDates(UUID examinationId, UUID classSubjectId);
}
