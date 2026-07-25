package com.acronexus.service.impl;

import com.acronexus.dto.AcademicRecordRequestDto;
import com.acronexus.dto.AcademicRecordResponseDto;
import com.acronexus.entity.AcademicRecord;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.AcademicRecordMapper;
import com.acronexus.repository.AcademicRecordRepository;
import com.acronexus.service.AcademicRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.acronexus.repository.StudentRepository;
import com.acronexus.security.UserDetailsImpl;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
public class AcademicRecordServiceImpl implements AcademicRecordService {

    private final AcademicRecordRepository repository;
    private final AcademicRecordMapper mapper;
    private final StudentRepository studentRepository;

    @Override
    @Transactional
    public AcademicRecordResponseDto create(AcademicRecordRequestDto requestDto) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        com.acronexus.entity.Student student = studentRepository.findByUser_Id(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for current user"));
        
        AcademicRecord entity = mapper.toEntity(requestDto);
        entity.setStudent(student);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    public AcademicRecordResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicRecord not found with id: " + id));
    }

    @Override
    public List<AcademicRecordResponseDto> getAll() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return repository.findByStudentId(userDetails.getId()).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AcademicRecordResponseDto update(UUID id, AcademicRecordRequestDto requestDto) {
        AcademicRecord entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicRecord not found with id: " + id));
        
        entity.setEducationLevel(requestDto.getEducationLevel());
        entity.setInstitutionName(requestDto.getInstitutionName());
        entity.setPassingYear(requestDto.getPassingYear());
        entity.setPercentage(requestDto.getPercentage());
        entity.setDocumentUrl(requestDto.getDocumentUrl());
        
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("AcademicRecord not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
