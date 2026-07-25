package com.acronexus.service.impl;

import com.acronexus.dto.AssignmentSubmissionRequestDto;
import com.acronexus.dto.AssignmentSubmissionResponseDto;
import com.acronexus.entity.AssignmentSubmission;
import com.acronexus.mapper.AssignmentSubmissionMapper;
import com.acronexus.repository.AssignmentSubmissionRepository;
import com.acronexus.service.AssignmentSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentSubmissionServiceImpl implements AssignmentSubmissionService {

    private final AssignmentSubmissionRepository repository;
    private final AssignmentSubmissionMapper mapper;

    @Override
    @Transactional
    public AssignmentSubmissionResponseDto create(AssignmentSubmissionRequestDto requestDto) {
        AssignmentSubmission entity = mapper.toEntity(requestDto);
        AssignmentSubmission saved = repository.save(entity);
        return mapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentSubmissionResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new RuntimeException("AssignmentSubmission not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentSubmissionResponseDto> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AssignmentSubmissionResponseDto update(UUID id, AssignmentSubmissionRequestDto requestDto) {
        repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AssignmentSubmission not found with id: " + id));
        
        AssignmentSubmission updatedEntity = mapper.toEntity(requestDto);
        updatedEntity.setId(id);
        
        AssignmentSubmission saved = repository.save(updatedEntity);
        return mapper.toDto(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("AssignmentSubmission not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
