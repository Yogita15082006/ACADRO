package com.acronexus.service.impl;

import com.acronexus.dto.NoticeDto;
import com.acronexus.dto.NoticeRequest;
import com.acronexus.dto.NoticeSearchFilter;
import com.acronexus.entity.*;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.exception.UnauthorizedException;
import com.acronexus.mapper.NoticeMapper;
import com.acronexus.repository.*;
import com.acronexus.service.NoticeService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.ZonedDateTime;

@Service
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final DepartmentRepository departmentRepository;
    private final AcroClassRepository acroClassRepository;
    private final UserRepository userRepository;
    private final FileStorageRepository fileStorageRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final NoticeMapper noticeMapper;
    private final com.acronexus.service.AiService aiService;

    public NoticeServiceImpl(NoticeRepository noticeRepository,
                             DepartmentRepository departmentRepository,
                             AcroClassRepository acroClassRepository,
                             UserRepository userRepository,
                             FileStorageRepository fileStorageRepository,
                             StudentEnrollmentRepository studentEnrollmentRepository,
                             NoticeMapper noticeMapper,
                             com.acronexus.service.AiService aiService) {
        this.noticeRepository = noticeRepository;
        this.departmentRepository = departmentRepository;
        this.acroClassRepository = acroClassRepository;
        this.userRepository = userRepository;
        this.fileStorageRepository = fileStorageRepository;
        this.studentEnrollmentRepository = studentEnrollmentRepository;
        this.noticeMapper = noticeMapper;
        this.aiService = aiService;
    }

    @Override
    @Transactional
    public NoticeDto createNotice(NoticeRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notice notice = new Notice();
        notice.setTitle(request.getTitle());
        notice.setDescription(request.getDescription());
        notice.setCategory(request.getCategory());
        notice.setPriority(request.getPriority());
        
        if (request.getPublishDate() != null) {
            notice.setPublishDate(request.getPublishDate());
        }

        // Validate expiry date vs publish date if both provided.
        // NOTE: As per schema constraints, expiryDate is not persisted.
        if (request.getExpiryDate() != null && notice.getPublishDate() != null) {
            if (notice.getPublishDate().isAfter(request.getExpiryDate())) {
                throw new IllegalArgumentException("Publish Date cannot be after Expiry Date");
            }
        }

        if (request.getFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("File not found"));
            notice.setFile(file);
        }

        if (request.getTargets() != null && !request.getTargets().isEmpty()) {
            java.util.List<NoticeTargetAssignment> targetAssignments = new java.util.ArrayList<>();
            for (com.acronexus.dto.NoticeTargetAssignmentDto targetDto : request.getTargets()) {
                NoticeTargetAssignment assignment = new NoticeTargetAssignment();
                assignment.setNotice(notice);
                assignment.setBatchYear(targetDto.getBatchYear());
                assignment.setAcademicYear(targetDto.getAcademicYear());
                assignment.setSemester(targetDto.getSemester());
                assignment.setIsEntireBatch(targetDto.getIsEntireBatch() != null ? targetDto.getIsEntireBatch() : false);
                
                if (targetDto.getAcroClassId() != null) {
                    AcroClass acroClass = acroClassRepository.findById(targetDto.getAcroClassId())
                            .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + targetDto.getAcroClassId()));
                    assignment.setAcroClass(acroClass);
                }
                
                targetAssignments.add(assignment);
            }
            notice.setTargetAssignments(targetAssignments);
        }

        notice.setIsActive(true);
        notice.setPublishedBy(user);
        notice.setIsActive(true);
        notice.setIsDeleted(false);

        notice = noticeRepository.save(notice);
        return noticeMapper.toDto(notice);
    }

    @Override
    @Transactional
    public NoticeDto updateNotice(UUID noticeId, NoticeRequest request, UUID userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() == UserRole.FACULTY && !notice.getPublishedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You can only update notices you created");
        }

        notice.setTitle(request.getTitle());
        notice.setDescription(request.getDescription());
        notice.setCategory(request.getCategory());
        notice.setPriority(request.getPriority());

        if (request.getPublishDate() != null) {
            notice.setPublishDate(request.getPublishDate());
        }

        if (request.getExpiryDate() != null && notice.getPublishDate() != null) {
            if (notice.getPublishDate().isAfter(request.getExpiryDate())) {
                throw new IllegalArgumentException("Publish Date cannot be after Expiry Date");
            }
        }

        if (request.getFileId() != null) {
            FileStorage file = fileStorageRepository.findById(request.getFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("File not found"));
            notice.setFile(file);
        } else {
            notice.setFile(null);
        }

        notice.getTargetAssignments().clear();
        
        if (request.getTargets() != null && !request.getTargets().isEmpty()) {
            for (com.acronexus.dto.NoticeTargetAssignmentDto targetDto : request.getTargets()) {
                NoticeTargetAssignment assignment = new NoticeTargetAssignment();
                assignment.setNotice(notice);
                assignment.setBatchYear(targetDto.getBatchYear());
                assignment.setAcademicYear(targetDto.getAcademicYear());
                assignment.setSemester(targetDto.getSemester());
                assignment.setIsEntireBatch(targetDto.getIsEntireBatch() != null ? targetDto.getIsEntireBatch() : false);
                
                if (targetDto.getAcroClassId() != null) {
                    AcroClass acroClass = acroClassRepository.findById(targetDto.getAcroClassId())
                            .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + targetDto.getAcroClassId()));
                    assignment.setAcroClass(acroClass);
                }
                
                notice.getTargetAssignments().add(assignment);
            }
        }

        notice = noticeRepository.save(notice);

        notice = noticeRepository.save(notice);
        return noticeMapper.toDto(notice);
    }

    @Override
    @Transactional
    public void deleteNotice(UUID noticeId, UUID userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() == UserRole.FACULTY && !notice.getPublishedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete notices you created");
        }

        notice.setIsDeleted(true);
        noticeRepository.save(notice);
    }

    @Override
    @Transactional
    public NoticeDto publishNotice(UUID noticeId, UUID userId) {
        return toggleNoticeActiveStatus(noticeId, userId, true);
    }

    @Override
    @Transactional
    public NoticeDto unpublishNotice(UUID noticeId, UUID userId) {
        return toggleNoticeActiveStatus(noticeId, userId, false);
    }

    private NoticeDto toggleNoticeActiveStatus(UUID noticeId, UUID userId, boolean isActive) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() == UserRole.FACULTY && !notice.getPublishedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You can only publish/unpublish notices you created");
        }

        notice.setIsActive(isActive);
        notice = noticeRepository.save(notice);
        return noticeMapper.toDto(notice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeDto> getStudentNotices(UUID studentId) {
        StudentEnrollment enrollment = studentEnrollmentRepository
                .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Active student enrollment not found"));

        String batchYear = enrollment.getStudent().getBatchYear();
        UUID classId = enrollment.getAcroClass().getId();

        return noticeRepository.findStudentFeed(classId, batchYear).stream()
                .map(noticeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NoticeDto getNoticeDetails(UUID noticeId, UUID userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
        
        if (notice.getIsDeleted()) {
            throw new ResourceNotFoundException("Notice has been deleted");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() == UserRole.STUDENT && (!notice.getIsActive() || (notice.getPublishDate() != null && notice.getPublishDate().isAfter(ZonedDateTime.now())))) {
            throw new UnauthorizedException("Notice is currently unavailable");
        }

        return noticeMapper.toDto(notice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeDto> searchNotices(NoticeSearchFilter filter, UUID userId) {
        Specification<Notice> spec = (root, query, cb) -> {
            // Note: In a production scenario, we should ensure the relationships 
            // (file, publishedBy, etc.) are fetched with an EntityGraph or JOIN FETCH to prevent N+1 queries.
            
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (filter.getKeyword() != null && !filter.getKeyword().isEmpty()) {
                String pattern = "%" + filter.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            if (filter.getTitle() != null && !filter.getTitle().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + filter.getTitle().toLowerCase() + "%"));
            }

            if (filter.getCategory() != null && !filter.getCategory().isEmpty()) {
                predicates.add(cb.equal(root.get("category"), filter.getCategory()));
            }

            if (filter.getDepartmentId() != null) {
                jakarta.persistence.criteria.Join<Notice, NoticeTargetAssignment> joinTa = root.join("targetAssignments", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.equal(joinTa.get("acroClass").get("department").get("id"), filter.getDepartmentId()));
            }

            if (filter.getClassId() != null) {
                jakarta.persistence.criteria.Join<Notice, NoticeTargetAssignment> joinTa = root.join("targetAssignments", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.equal(joinTa.get("acroClass").get("id"), filter.getClassId()));
            }

            if (filter.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("publishDate"), filter.getStartDate()));
            }

            if (filter.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("publishDate"), filter.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // NoticeRepository already defines EntityGraphs for other methods, we can just fetch all using spec
        // But for Specifications, EntityGraph needs to be attached. 
        // Spring Data JPA applies @EntityGraph automatically if we define a method like findAll(Specification, EntityGraph).
        // Since we don't have that yet, we can rely on standard findAll.
        return noticeRepository.findAll(spec).stream()
                .map(noticeMapper::toDto)
                .collect(Collectors.toList());
    }
    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto summarizeNotice(UUID noticeId, UUID userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
        
        if (notice.getIsDeleted()) {
            throw new ResourceNotFoundException("Notice has been deleted");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() == UserRole.STUDENT && (!notice.getIsActive() || (notice.getPublishDate() != null && notice.getPublishDate().isAfter(ZonedDateTime.now())))) {
            throw new UnauthorizedException("Notice is currently unavailable");
        }

        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("NOTICE_SUMMARY")
                .contextType("notice-summary")
                .contextId(noticeId.toString())
                .data(java.util.Map.of(
                        "title", notice.getTitle(),
                        "description", notice.getDescription(),
                        "category", notice.getCategory(),
                        "priority", notice.getPriority().name()
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto getImportantNoticeHighlights(UUID studentId) {
        StudentEnrollment enrollment = studentEnrollmentRepository
                .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Active student enrollment not found"));

        String batchYear = enrollment.getStudent().getBatchYear();
        UUID classId = enrollment.getAcroClass().getId();

        List<Notice> notices = noticeRepository.findStudentFeed(classId, batchYear);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("NOTICE_HIGHLIGHTS")
                .contextType("notice-highlights")
                .contextId(studentId.toString())
                .data(java.util.Map.of(
                        "notices", notices.stream().map(n -> java.util.Map.of(
                                "id", n.getId(),
                                "title", n.getTitle(),
                                "priority", n.getPriority().name(),
                                "publishDate", n.getPublishDate() != null ? n.getPublishDate().toString() : ""
                        )).collect(Collectors.toList())
                ))
                .build();
                
        return aiService.getInsights(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.acronexus.dto.ai.AiInsightDto getPersonalizedRecommendations(UUID studentId) {
        StudentEnrollment enrollment = studentEnrollmentRepository
                .findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Active student enrollment not found"));

        String batchYear = enrollment.getStudent().getBatchYear();
        UUID classId = enrollment.getAcroClass().getId();

        List<Notice> notices = noticeRepository.findStudentFeed(classId, batchYear);
        
        com.acronexus.dto.ai.AiAnalyticsRequest request = com.acronexus.dto.ai.AiAnalyticsRequest.builder()
                .insightType("NOTICE_RECOMMENDATIONS")
                .contextType("notice-recommendation")
                .contextId(studentId.toString())
                .data(java.util.Map.of(
                        "notices", notices.stream().map(n -> java.util.Map.of(
                                "id", n.getId(),
                                "title", n.getTitle(),
                                "category", n.getCategory()
                        )).collect(Collectors.toList())
                ))
                .build();
                
        return aiService.getInsights(request);
    }
    @Override
    @Transactional
    public UUID uploadAttachment(org.springframework.web.multipart.MultipartFile file, UUID userId) {
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads/notices/");
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath);

            com.acronexus.entity.FileStorage fs = new com.acronexus.entity.FileStorage();
            fs.setFileName(file.getOriginalFilename());
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType(file.getContentType());
            fs.setUploadedBy(userRepository.findById(userId).orElse(null));
            fs.setUploadedAt(java.time.ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            fs = fileStorageRepository.save(fs);
            return fs.getId();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.http.ResponseEntity<byte[]> downloadAttachment(UUID fileId) {
        com.acronexus.entity.FileStorage fs = fileStorageRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(fs.getDocumentUrl());
            byte[] fileBytes = java.nio.file.Files.readAllBytes(path);
            
            return org.springframework.http.ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fs.getFileName() + "\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType(fs.getFileType() != null ? fs.getFileType() : "application/octet-stream"))
                    .body(fileBytes);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error reading file", e);
        }
    }
}
