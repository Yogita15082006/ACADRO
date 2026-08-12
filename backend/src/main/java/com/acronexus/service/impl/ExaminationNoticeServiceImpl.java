package com.acronexus.service.impl;

import com.acronexus.dto.ExaminationNoticeRequestDto;
import com.acronexus.dto.ExaminationNoticeResponseDto;
import com.acronexus.entity.Examination;
import com.acronexus.entity.ExaminationNotice;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ExaminationNoticeMapper;
import com.acronexus.repository.ExaminationNoticeRepository;
import com.acronexus.repository.ExaminationRepository;
import com.acronexus.service.ExaminationNoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExaminationNoticeServiceImpl implements ExaminationNoticeService {

    private final ExaminationNoticeRepository repository;
    private final ExaminationRepository examinationRepository;
    private final ExaminationNoticeMapper mapper;

    @Override
    @Transactional
    public ExaminationNoticeResponseDto create(ExaminationNoticeRequestDto requestDto) {
        Examination examination = examinationRepository.findByIdAndIsDeletedFalse(requestDto.getExaminationId())
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        
        ExaminationNotice entity = mapper.toEntity(requestDto);
        entity.setExamination(examination);
        
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExaminationNoticeResponseDto> getByExaminationId(UUID examinationId) {
        return repository.findByExaminationIdOrderByPublishDateDesc(examinationId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        ExaminationNotice entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
        repository.delete(entity);
    }
}
