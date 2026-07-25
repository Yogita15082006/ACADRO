package com.acronexus.service.impl;

import com.acronexus.dto.ProfessionalDetailRequestDto;
import com.acronexus.dto.ProfessionalDetailResponseDto;
import com.acronexus.entity.ProfessionalDetail;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ProfessionalDetailMapper;
import com.acronexus.repository.ProfessionalDetailRepository;
import com.acronexus.service.ProfessionalDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.acronexus.repository.FacultyRepository;
import com.acronexus.security.UserDetailsImpl;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
public class ProfessionalDetailServiceImpl implements ProfessionalDetailService {

    private final ProfessionalDetailRepository repository;
    private final ProfessionalDetailMapper mapper;
    private final FacultyRepository facultyRepository;

    @Override
    @Transactional
    public ProfessionalDetailResponseDto create(ProfessionalDetailRequestDto requestDto) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        com.acronexus.entity.Faculty faculty = facultyRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found for current user"));

        ProfessionalDetail entity = mapper.toEntity(requestDto);
        entity.setFaculty(faculty);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    public ProfessionalDetailResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("ProfessionalDetail not found with id: " + id));
    }

    @Override
    public List<ProfessionalDetailResponseDto> getAll() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return repository.findByFacultyId(userDetails.getId()).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProfessionalDetailResponseDto update(UUID id, ProfessionalDetailRequestDto requestDto) {
        ProfessionalDetail entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProfessionalDetail not found with id: " + id));
        
        entity.setResumeUrl(requestDto.getResumeUrl());
        entity.setPublications(requestDto.getPublications());
        entity.setCertifications(requestDto.getCertifications());
        
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ProfessionalDetail not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
