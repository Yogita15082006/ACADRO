package com.acronexus.service;

import com.acronexus.dto.FacultyActivityRequestDto;
import com.acronexus.dto.FacultyActivityResponseDto;
import java.util.List;
import java.util.UUID;

public interface FacultyActivityService {
    FacultyActivityResponseDto create(FacultyActivityRequestDto requestDto);
    FacultyActivityResponseDto getById(UUID id);
    List<FacultyActivityResponseDto> getAll();
    FacultyActivityResponseDto create(FacultyActivityRequestDto requestDto, java.util.UUID facultyId);
    List<FacultyActivityResponseDto> bulkCreate(com.acronexus.dto.FacultyActivityBulkRequestDto requestDto, java.util.UUID facultyId);
    FacultyActivityResponseDto update(UUID id, FacultyActivityRequestDto requestDto);
    void delete(UUID id);
    List<FacultyActivityResponseDto> getByFacultyId(UUID facultyId);
}
