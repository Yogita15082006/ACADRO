package com.acronexus.service.impl;

import com.acronexus.dto.TimetableRequestDto;
import com.acronexus.dto.TimetableResponseDto;
import com.acronexus.entity.Timetable;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.TimetableMapper;
import com.acronexus.repository.TimetableRepository;
import com.acronexus.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository repository;
    private final TimetableMapper mapper;

    @Override
    @Transactional
    public TimetableResponseDto create(TimetableRequestDto requestDto) {
        Timetable entity = mapper.toEntity(requestDto);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    public TimetableResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found with id: " + id));
    }

    @Override
    public List<TimetableResponseDto> getAll() {
        return repository.findByIsActiveTrueOrderByUploadedAtDesc().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TimetableResponseDto update(UUID id, TimetableRequestDto requestDto) {
        Timetable entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found with id: " + id));
        // Update fields based on requestDto
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Timetable not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
