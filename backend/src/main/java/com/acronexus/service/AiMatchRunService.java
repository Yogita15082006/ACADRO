package com.acronexus.service;

import com.acronexus.dto.AiMatchRunRequestDto;
import com.acronexus.dto.AiMatchRunResponseDto;
import java.util.List;
import java.util.UUID;

public interface AiMatchRunService {
    AiMatchRunResponseDto create(AiMatchRunRequestDto requestDto);
    AiMatchRunResponseDto getById(UUID id);
    List<AiMatchRunResponseDto> getAll();
    AiMatchRunResponseDto update(UUID id, AiMatchRunRequestDto requestDto);
    void delete(UUID id);
    com.acronexus.dto.ai.AiMatchResponse executeMatch();
    void applyChanges(com.acronexus.dto.ai.AiMatchResponse aiMatchResponse);
}
