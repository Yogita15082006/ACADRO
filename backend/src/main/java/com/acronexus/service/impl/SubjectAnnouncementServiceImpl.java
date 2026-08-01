package com.acronexus.service.impl;

import com.acronexus.dto.SubjectAnnouncementRequestDto;
import com.acronexus.dto.SubjectAnnouncementResponseDto;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.CoordinatorAssignment;
import com.acronexus.entity.StudentEnrollment;
import com.acronexus.entity.SubjectAnnouncement;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.SubjectAnnouncementRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.SubjectAnnouncementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectAnnouncementServiceImpl implements SubjectAnnouncementService {

    private final SubjectAnnouncementRepository subjectAnnouncementRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SubjectAnnouncementResponseDto> getAnnouncementsForSubject(UUID classSubjectId, UserDetailsImpl userDetails) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject Workspace not found"));

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
                throw new AccessDeniedException("Access Denied: You are not assigned to this subject workspace.");
            }
        }

        List<SubjectAnnouncement> announcements = subjectAnnouncementRepository
                .findByClassSubjectIdAndIsDeletedFalseOrderByCreatedAtDesc(classSubjectId);

        return announcements.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SubjectAnnouncementResponseDto createAnnouncement(UUID classSubjectId, SubjectAnnouncementRequestDto requestDto, UserDetailsImpl userDetails) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject Workspace not found"));

        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        if (!"ROLE_FACULTY".equals(role) || classSubject.getFaculty() == null || !classSubject.getFaculty().getId().equals(userDetails.getId())) {
            throw new AccessDeniedException("Only the officially assigned faculty for this subject card can post announcements.");
        }

        SubjectAnnouncement announcement = new SubjectAnnouncement();
        announcement.setClassSubject(classSubject);
        announcement.setSubject(classSubject.getSubject());
        announcement.setFaculty(classSubject.getFaculty());
        
        String facultyFullName = "Assigned Faculty";
        if (classSubject.getFaculty().getUser() != null) {
            facultyFullName = classSubject.getFaculty().getUser().getFirstName() + " " + classSubject.getFaculty().getUser().getLastName();
        }
        announcement.setFacultyName(facultyFullName);

        String departmentName = (classSubject.getAcroClass() != null && classSubject.getAcroClass().getDepartment() != null)
                ? classSubject.getAcroClass().getDepartment().getName() : "N/A";
        announcement.setDepartment(departmentName);

        String className = (classSubject.getAcroClass() != null) ? classSubject.getAcroClass().getName() : "N/A";
        announcement.setClassName(className);

        String yearStr = (classSubject.getAcademicYear() != null) ? String.valueOf(classSubject.getAcademicYear().getYear()) : "N/A";
        announcement.setYear(yearStr);

        String semStr = (classSubject.getSemester() != null) ? String.valueOf(classSubject.getSemester().getSemesterNumber()) : "N/A";
        announcement.setSemester(semStr);

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
        announcement.setBatch(resolvedBatch);

        announcement.setTitle(requestDto.getTitle().trim());
        announcement.setMessage(requestDto.getMessage().trim());
        announcement.setPriority(requestDto.getPriority() != null ? requestDto.getPriority() : "Normal");
        announcement.setIsDeleted(false);

        SubjectAnnouncement saved = subjectAnnouncementRepository.save(announcement);
        log.info("Faculty {} posted subject announcement {} for classSubject {}", userDetails.getId(), saved.getId(), classSubjectId);
        
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteAnnouncement(UUID announcementId, UserDetailsImpl userDetails) {
        SubjectAnnouncement announcement = subjectAnnouncementRepository.findByIdAndIsDeletedFalse(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found or already deleted"));

        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        if (!"ROLE_FACULTY".equals(role) || announcement.getFaculty() == null || !announcement.getFaculty().getId().equals(userDetails.getId())) {
            throw new AccessDeniedException("Only the faculty who created this announcement can delete it.");
        }

        announcement.setIsDeleted(true);
        subjectAnnouncementRepository.save(announcement);
        log.info("Faculty {} soft-deleted subject announcement {}", userDetails.getId(), announcementId);
    }

    private SubjectAnnouncementResponseDto mapToDto(SubjectAnnouncement entity) {
        String formattedDate = "Just now";
        if (entity.getCreatedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
            formattedDate = entity.getCreatedAt().format(formatter);
        }

        SubjectAnnouncementResponseDto dto = new SubjectAnnouncementResponseDto();
        dto.setId(entity.getId());
        dto.setClassSubjectId(entity.getClassSubject() != null ? entity.getClassSubject().getId() : null);
        dto.setSubjectId(entity.getSubject() != null ? entity.getSubject().getId() : null);
        dto.setFacultyId(entity.getFaculty() != null ? entity.getFaculty().getId() : null);
        dto.setFacultyName(entity.getFacultyName());
        dto.setPostedBy(entity.getFacultyName());
        dto.setDepartment(entity.getDepartment());
        dto.setBatch(entity.getBatch());
        dto.setYear(entity.getYear());
        dto.setSemester(entity.getSemester());
        dto.setClassName(entity.getClassName());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setDescription(entity.getMessage());
        dto.setPriority(entity.getPriority());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setPublishDate(formattedDate);
        dto.setIsDeleted(entity.getIsDeleted());
        return dto;
    }
}
