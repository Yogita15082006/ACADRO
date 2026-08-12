package com.acronexus.service;

import com.acronexus.dto.ExaminationNoticeRequestDto;
import com.acronexus.dto.ExaminationNoticeResponseDto;
import java.util.List;
import java.util.UUID;

public interface ExaminationNoticeService {
    ExaminationNoticeResponseDto create(ExaminationNoticeRequestDto requestDto);
    List<ExaminationNoticeResponseDto> getByExaminationId(UUID examinationId);
    void delete(UUID id);
}
