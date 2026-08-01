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
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.LectureMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZonedDateTime;
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
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
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

    @Override
    @Transactional(readOnly = true)
    public List<LectureMaterialResponseDto> getSubjectMaterials(UUID classSubjectId, UserDetailsImpl userDetails) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject Workspace not found"));
        
        if (userDetails != null && userDetails.getAuthorities() != null && !userDetails.getAuthorities().isEmpty()) {
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            if ("ROLE_STUDENT".equals(role)) {
                StudentEnrollment enrollment = studentEnrollmentRepository
                        .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(userDetails.getId())
                        .orElse(null);
                boolean isEnrolled = enrollment != null
                        && enrollment.getAcroClass() != null && classSubject.getAcroClass() != null
                        && enrollment.getAcroClass().getId().equals(classSubject.getAcroClass().getId())
                        && enrollment.getSemester() != null && classSubject.getSemester() != null
                        && enrollment.getSemester().getId().equals(classSubject.getSemester().getId());
                if (!isEnrolled) {
                    throw new AccessDeniedException("Access Denied: You are not enrolled in this subject's class and semester.");
                }
            } else if ("ROLE_FACULTY".equals(role)) {
                if (classSubject.getFaculty() == null || !classSubject.getFaculty().getId().equals(userDetails.getId())) {
                    throw new AccessDeniedException("Faculty can only access materials for subjects assigned to them.");
                }
            }
        }

        List<LectureMaterial> materials = repository.findByClassSubjectIdAndIsDeletedFalse(classSubjectId);
        return materials.stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LectureMaterialResponseDto uploadSubjectMaterial(UUID classSubjectId, MultipartFile file, String title, String unit, Integer unitNumber, UserDetailsImpl userDetails) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject Workspace not found"));

        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        if (!"ROLE_FACULTY".equals(role) || classSubject.getFaculty() == null || !classSubject.getFaculty().getId().equals(userDetails.getId())) {
            throw new AccessDeniedException("Only the officially assigned faculty for this subject card can upload materials.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty.");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Material title is required.");
        }

        Path uploadPath = Paths.get("uploads/lecture_materials/");
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String storedFileName = UUID.randomUUID().toString() + "_" + originalFilename;
            Path filePath = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), filePath);

            User facultyUser = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty user not found"));

            FileStorage fs = new FileStorage();
            fs.setFileName(originalFilename);
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType(file.getContentType() != null ? file.getContentType() : "LECTURE_MATERIAL");
            fs.setUploadedBy(facultyUser);
            fs.setUploadedAt(ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            fs = fileStorageRepository.save(fs);

            LectureMaterial lm = new LectureMaterial();
            lm.setClassSubject(classSubject);
            lm.setTitle(title.trim());
            lm.setUnit(unit != null && !unit.trim().isEmpty() ? unit.trim() : "General");
            lm.setUnitNumber(unitNumber != null ? unitNumber : 1);
            lm.setFile(fs);
            lm.setUploadedBy(facultyUser);
            lm.setIsActive(true);
            lm.setIsDeleted(false);
            lm.setVersionNumber(1);
            lm.setUploadedAt(Instant.now());
            lm.setUpdatedAt(Instant.now());

            String facultyFullName = facultyUser.getFirstName() + " " + (facultyUser.getLastName() != null ? facultyUser.getLastName() : "");
            lm.setFacultyName(facultyFullName.trim());
            lm.setFileName(originalFilename);

            if (classSubject.getAcroClass() != null) {
                lm.setClassName(classSubject.getAcroClass().getName());
                if (classSubject.getAcroClass().getDepartment() != null) {
                    lm.setDepartment(classSubject.getAcroClass().getDepartment().getName());
                }
            }
            if (classSubject.getAcademicYear() != null) {
                lm.setYear(String.valueOf(classSubject.getAcademicYear().getYear()));
            }
            if (classSubject.getSemester() != null) {
                lm.setSemester(String.valueOf(classSubject.getSemester().getSemesterNumber()));
            }

            String resolvedBatch = "N/A";
            if (classSubject.getAcroClass() != null && classSubject.getSemester() != null && classSubject.getAcademicYear() != null) {
                resolvedBatch = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(classSubject.getAcroClass().getName())
                        .stream()
                        .filter(ca -> java.util.Objects.equals(ca.getSemester(), "Semester " + classSubject.getSemester().getSemesterNumber()) &&
                                      java.util.Objects.equals(ca.getAcademicYear(), classSubject.getAcademicYear().getYear()))
                        .map(CoordinatorAssignment::getBatch)
                        .findFirst()
                        .orElse("N/A");
            }
            lm.setBatch(resolvedBatch);
            lm.setFileUrl("/api/v1/lecture-materials/temp");
            lm = repository.save(lm);

            lm.setFileUrl("/api/v1/lecture-materials/" + lm.getId() + "/download");
            lm = repository.save(lm);

            return mapper.toDto(lm);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save physical file: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void deleteSubjectMaterial(UUID materialId, UserDetailsImpl userDetails, String token) {
        UUID userId = userDetails != null ? userDetails.getId() : jwtUtils.getUserIdFromToken(token);
        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));

        if (!material.getUploadedBy().getId().equals(userId) && 
            (material.getClassSubject() == null || material.getClassSubject().getFaculty() == null || !material.getClassSubject().getFaculty().getId().equals(userId))) {
            throw new UnauthorizedException("Only the faculty who uploaded the material can delete it.");
        }

        material.setIsDeleted(true);
        material.setUpdatedAt(Instant.now());
        repository.save(material);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadMaterialFile(UUID materialId) {
        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));
        if (material.getFile() == null || material.getFile().getDocumentUrl() == null) {
            throw new ResourceNotFoundException("Associated file storage or document path not found.");
        }
        try {
            Path path = Paths.get(material.getFile().getDocumentUrl());
            if (!Files.exists(path)) {
                throw new ResourceNotFoundException("Physical file not found on server storage.");
            }
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Error reading file from disk: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getMaterialFileName(UUID materialId) {
        LectureMaterial material = repository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture Material not found"));
        if (material.getFileName() != null && !material.getFileName().isEmpty()) {
            return material.getFileName();
        }
        if (material.getFile() != null && material.getFile().getFileName() != null) {
            return material.getFile().getFileName();
        }
        return "document.pdf";
    }
}
