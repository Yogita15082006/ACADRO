package com.acronexus.service;

import com.acronexus.dto.ExaminationNoticeRequestDto;
import com.acronexus.dto.ExaminationNoticeResponseDto;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

public interface ExaminationNoticeService {
    ExaminationNoticeResponseDto create(ExaminationNoticeRequestDto requestDto);
    ExaminationNoticeResponseDto update(UUID id, ExaminationNoticeRequestDto requestDto);
    List<ExaminationNoticeResponseDto> getByExaminationId(UUID examinationId);
    void delete(UUID id);
    
    UUID uploadAttachment(MultipartFile file, UUID currentUserId);
    ResponseEntity<byte[]> downloadAttachment(UUID fileId);
}
