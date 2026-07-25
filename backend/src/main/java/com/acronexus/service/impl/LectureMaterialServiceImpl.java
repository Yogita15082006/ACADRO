package com.acronexus.service.impl;

import com.acronexus.dto.LectureMaterialRequestDto;
import com.acronexus.dto.LectureMaterialResponseDto;
import com.acronexus.entity.*;
import com.acronexus.exception.DuplicateResourceException;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.exception.UnauthorizedException;
import com.acronexus.mapper.LectureMaterialMapper;
import com.acronexus.repository.*;
import com.acronexus.security.JwtUtils;
import com.acronexus.service.LectureMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LectureMaterialServiceImpl implements LectureMaterialService {

    private final LectureMaterialRepository repository;
    private final LectureMaterialMapper mapper;
    private final JwtUtils jwtUtils;
    private final ClassSubjectRepository classSubjectRepository;
    private final FileStorageRepository fileStorageRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final ResourceDownloadRepository resourceDownloadRepository;
    private final com.acronexus.service.AiService aiService;

    @Override
    @Transactional
    public LectureMaterialResponseDto uploadMaterial(LectureMaterialRequestDto request, String token) {
        UUID facultyId = jwtUtils.getUserIdFromToken(token);
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        ClassSubject classSubject = classSubjectRepository.findById(request.getClassSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Class Subject not found"));

        if (!classSubject.getFaculty().getId().equals(facultyId)) {
            throw new UnauthorizedException("You are not authorized to upload materials for this subject");
        }

        FileStorage file = fileStorageRepository.findById(request.getFileId())
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        if (repository.existsByFacultyAndSubjectAndTitle(facultyId, request.getClassSubjectId(), request.getTitle())) {
            throw new DuplicateResourceException("An active lecture material with this title already exists for this subject");
        }

        LectureMaterial material = mapper.toEntity(request);
        material.setClassSubject(classSubject);
        material.setFile(file);
        material.setUploadedBy(faculty);
        material.setVersionNumber(1);
        material.setUploadedAt(Instant.now());

        return mapper.toDto(repository.save(material));
    }

    @Override
    @Transactional
    public LectureMaterialResponseDto updateMaterial(UUID materialId, LectureMaterialRequestDto request, String token) {
        UUID facultyId = jwtUtils.getUserIdFromToken(token);
        LectureMaterial material = repository.findByIdWithDetails(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));

        if (!material.getUploadedBy().getId().equals(facultyId)) {
            throw new UnauthorizedException("You can only update your own materials");
        }

        if (!material.getClassSubject().getId().equals(request.getClassSubjectId())) {
            ClassSubject classSubject = classSubjectRepository.findById(request.getClassSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Class Subject not found"));
            if (!classSubject.getFaculty().getId().equals(facultyId)) {
                throw new UnauthorizedException("You are not authorized for this subject");
            }
            material.setClassSubject(classSubject);
        }

        if (!material.getFile().getId().equals(request.getFileId())) {
            FileStorage file = fileStorageRepository.findById(request.getFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("File not found"));
            material.setFile(file);
            material.setVersionNumber(material.getVersionNumber() + 1);
        }

        material.setTitle(request.getTitle());
        material.setDescription(request.getDescription());
        material.setUnitNumber(request.getUnitNumber());
        if(request.getIsActive() != null) {
            material.setIsActive(request.getIsActive());
        }

        return mapper.toDto(repository.save(material));
    }

    @Override
    @Transactional
    public void deleteMaterial(UUID materialId, String token) {
        UUID facultyId = jwtUtils.getUserIdFromToken(token);
        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));

        if (!material.getUploadedBy().getId().equals(facultyId)) {
            throw new UnauthorizedException("You can only delete your own materials");
        }

        material.setIsDeleted(true);
        repository.save(material);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LectureMaterialResponseDto> getFacultyMaterials(String token) {
        UUID facultyId = jwtUtils.getUserIdFromToken(token);
        List<LectureMaterial> materials = repository.findByUploadedById(facultyId);
        return materials.stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LectureMaterialResponseDto> getStudentMaterials(String token) {
        UUID studentId = jwtUtils.getUserIdFromToken(token);
        StudentEnrollment enrollment = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Active student enrollment not found"));

        List<LectureMaterial> materials = repository.findActiveByClassId(enrollment.getAcroClass().getId());
        return materials.stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LectureMaterialResponseDto getMaterialDetails(UUID materialId, String token) {
        UUID studentId = jwtUtils.getUserIdFromToken(token);
        StudentEnrollment enrollment = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Active student enrollment not found"));

        LectureMaterial material = repository.findByIdAndClassId(materialId, enrollment.getAcroClass().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found or you don't have access"));

        return mapper.toDto(material);
    }

    @Override
    @Transactional
    public void trackDownload(UUID materialId, String token) {
        UUID studentUserId = jwtUtils.getUserIdFromToken(token);
        Student student = studentRepository.findByUser_Id(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));

        ResourceDownload download = new ResourceDownload();
        download.setMaterial(material);
        download.setStudent(student);
        download.setDownloadedAt(Instant.now());

        resourceDownloadRepository.save(download);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto generateStudyGuide(UUID materialId, String token) {
        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));

        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("LECTURE_MATERIAL_STUDY_GUIDE")
                .contextType("lecture-study-guide")
                .contextId(materialId.toString())
                .data(java.util.Map.of(
                        "title", material.getTitle(),
                        "description", material.getDescription() != null ? material.getDescription() : "",
                        "unitNumber", material.getUnitNumber()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto summarizeMaterial(UUID materialId, String token) {
        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));

        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("LECTURE_MATERIAL_SUMMARY")
                .contextType("lecture-summary")
                .contextId(materialId.toString())
                .data(java.util.Map.of(
                        "title", material.getTitle(),
                        "description", material.getDescription() != null ? material.getDescription() : "",
                        "unitNumber", material.getUnitNumber()
                ))
                .build();
                
        return aiService.getInsights(request);
    }
}
