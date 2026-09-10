package com.acronexus.service;

import com.acronexus.dto.ExaminationAttendanceDto;
import com.acronexus.dto.ExaminationAttendanceSaveRequestDto;

import java.util.List;
import java.util.UUID;

public interface ExaminationAttendanceService {
    List<ExaminationAttendanceDto> getAttendanceForExamination(UUID examinationId);
    void saveAttendanceForExamination(UUID examinationId, ExaminationAttendanceSaveRequestDto requestDto);
}
