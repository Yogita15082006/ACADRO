package com.acronexus.service.impl;

import com.acronexus.dto.FacultyActivityRequestDto;
import com.acronexus.dto.FacultyActivityResponseDto;
import com.acronexus.entity.FacultyActivity;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.FacultyActivityMapper;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.service.FacultyActivityService;
import com.acronexus.service.AttendanceSessionService;
import com.acronexus.entity.FacultyActivityStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacultyActivityServiceImpl implements FacultyActivityService {

    private final FacultyActivityRepository repository;
    private final FacultyActivityMapper mapper;
    private final AttendanceSessionService attendanceSessionService;

    @Override
    @Transactional
    public FacultyActivityResponseDto create(FacultyActivityRequestDto requestDto) {
        return create(requestDto, null);
    }

    @Override
    @Transactional
    public FacultyActivityResponseDto create(FacultyActivityRequestDto requestDto, java.util.UUID facultyId) {
        // Upsert logic to handle duplicate key constraint
        FacultyActivity existing = null;
        if (facultyId != null && requestDto.getClassSubjectId() != null && requestDto.getDate() != null) {
            existing = repository.findByFacultyIdAndClassSubjectIdAndDateAndLectureNumber(
                facultyId, requestDto.getClassSubjectId(), requestDto.getDate(), 1
            ).orElse(null);
        }

        FacultyActivity entity;
        if (existing != null) {
            // Update existing entity
            entity = existing;
            if (requestDto.getStatus() != null) {
                try {
                    entity.setStatus(FacultyActivityStatus.valueOf(requestDto.getStatus()));
                } catch (Exception e) {}
            }
            entity.setReason(requestDto.getReason());
        } else {
            // Create new entity
            entity = mapper.toEntity(requestDto);
            if (facultyId != null) {
                com.acronexus.entity.Faculty faculty = new com.acronexus.entity.Faculty();
                faculty.setId(facultyId);
                entity.setFaculty(faculty);
            }
        }
        
        entity = repository.save(entity);
        
        try {
            java.nio.file.Files.writeString(
                java.nio.file.Path.of("C:\\A\\Development\\AcroNexus\\backend\\debug.txt"),
                "Entity Status: " + entity.getStatus() + "\n" +
                "ClassSubject: " + (entity.getClassSubject() != null ? entity.getClassSubject().getId() : "null") + "\n",
                java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND
            );
        } catch(Exception ex) {}

        if (entity.getStatus() == FacultyActivityStatus.ABSENT || entity.getStatus() == FacultyActivityStatus.CLASS_MISSED) {
            try {
                attendanceSessionService.createSystemGeneratedSession(entity);
            } catch (Exception e) {
                try {
                    java.nio.file.Files.writeString(
                        java.nio.file.Path.of("C:\\A\\Development\\AcroNexus\\backend\\debug.txt"),
                        "Exception: " + e.getMessage() + "\n",
                        java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND
                    );
                } catch(Exception ex) {}
                System.err.println("Failed to create system generated session: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to create AI Attendance Session: " + e.getMessage());
            }
        }
        
        return mapper.toDto(entity);
    }

    @Override
    @Transactional
    public List<FacultyActivityResponseDto> bulkCreate(com.acronexus.dto.FacultyActivityBulkRequestDto requestDto, java.util.UUID facultyId) {
        return requestDto.getActivities().stream().map(dto -> create(dto, facultyId)).collect(Collectors.toList());
    }

    @Override
    public FacultyActivityResponseDto getById(UUID id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("FacultyActivity not found with id: " + id));
    }

    @Override
    public List<FacultyActivityResponseDto> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<FacultyActivityResponseDto> getByFacultyId(UUID facultyId) {
        return repository.findByFacultyIdOrderByDateDesc(facultyId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacultyActivityResponseDto update(UUID id, FacultyActivityRequestDto requestDto) {
        FacultyActivity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FacultyActivity not found with id: " + id));
        // Update fields based on requestDto
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("FacultyActivity not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
