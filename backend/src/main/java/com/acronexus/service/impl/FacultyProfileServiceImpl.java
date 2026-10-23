package com.acronexus.service.impl;

import com.acronexus.dto.faculty.*;
import com.acronexus.dto.response.AssignedSubjectDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.FacultyProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyProfileServiceImpl implements FacultyProfileService {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final FacultyPromotionRepository facultyPromotionRepository;
    private final FacultyResearchContributionRepository facultyResearchContributionRepository;
    private final FacultyResourcePersonRepository facultyResourcePersonRepository;
    private final ClassStrengthRepository classStrengthRepository;
    private final AcroClassRepository acroClassRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final SemesterRepository semesterRepository;
    private final AcademicYearRepository academicYearRepository;

    private boolean isHodOrAdmin(UserDetailsImpl actor) {
        if (actor == null) return false;
        return actor.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_HOD") || a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isCoordinator(UserDetailsImpl actor) {
        if (actor == null) return false;
        return actor.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR"));
    }

    private boolean isStudent(UserDetailsImpl actor) {
        if (actor == null) return false;
        return actor.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
    }

    private void validateViewAccess(UUID facultyId, UserDetailsImpl actor) {
        if (isStudent(actor)) {
            throw new AccessDeniedException("Students are not permitted to view faculty profiles");
        }
        if (actor == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        // Faculty themselves, HOD, Coordinator, and Admin can view
    }

    private void validateEditAccess(UUID facultyId, UserDetailsImpl actor) {
        if (isStudent(actor)) {
            throw new AccessDeniedException("Students cannot edit faculty profiles");
        }
        if (isCoordinator(actor) && !actor.getId().equals(facultyId) && !isHodOrAdmin(actor)) {
            throw new AccessDeniedException("Class Coordinators cannot edit faculty profiles");
        }
    }

    private String maskPan(String pan) {
        if (pan == null || pan.trim().isEmpty()) return "";
        String clean = pan.trim();
        if (clean.length() <= 4) return "****";
        return clean.substring(0, 2) + "******" + clean.substring(clean.length() - 2);
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyProfileDto getFacultyProfile(UUID facultyId, UserDetailsImpl actor) {
        validateViewAccess(facultyId, actor);

        User user = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty user not found"));

        Faculty faculty = facultyRepository.findById(facultyId).orElseGet(() -> {
            // Lazy initialize faculty record if missing for a faculty user
            Faculty f = new Faculty();
            f.setId(user.getId());
            f.setUser(user);
            f.setEmployeeId("EMP-" + user.getId().toString().substring(0, 6).toUpperCase());
            f.setDesignation(user.getRole() == UserRole.HOD ? "HOD" : "Assistant Professor");
            f.setJoiningDate(LocalDate.now());
            f.markAsNew();
            return facultyRepository.save(f);
        });

        boolean canViewConfidential = isHodOrAdmin(actor) || actor.getId().equals(facultyId);

        // Fetch assigned subjects
        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(faculty.getId());
        int calculatedTheoryHours = 0;
        int calculatedLabHours = 0;

        List<AssignedSubjectDto> assignedSubjectDtos = new ArrayList<>();
        for (ClassSubject cs : classSubjects) {
            AssignedSubjectDto dto = new AssignedSubjectDto();
            dto.setId(cs.getId());
            dto.setFacultyId(faculty.getId());
            if (cs.getSubject() != null) {
                dto.setSubjectName(cs.getSubject().getName());
            }
            if (cs.getAcroClass() != null) {
                dto.setClassName(cs.getAcroClass().getFunctionalClassName());
            }
            if (cs.getSemester() != null) {
                dto.setSemester(cs.getSemester().getSemesterNumber() != null ? 
                    "Semester " + cs.getSemester().getSemesterNumber() : "Unknown");
            }
            if (cs.getAcademicYear() != null) {
                dto.setAcademicYear(cs.getAcademicYear().getYear());
            }
            if (cs.getSyllabusSubject() != null) {
                if (cs.getSyllabusSubject().getTheoryHours() != null) {
                    calculatedTheoryHours += cs.getSyllabusSubject().getTheoryHours();
                }
                if (cs.getSyllabusSubject().getPracticalHours() != null) {
                    calculatedLabHours += cs.getSyllabusSubject().getPracticalHours();
                }
            }
            assignedSubjectDtos.add(dto);
        }

        // Load promotions
        List<FacultyPromotionDto> promotions = facultyPromotionRepository
                .findByFacultyIdOrderByPromotionDateDesc(facultyId).stream()
                .map(p -> FacultyPromotionDto.builder()
                        .id(p.getId())
                        .facultyId(facultyId)
                        .facultyName(user.getFirstName() + " " + user.getLastName())
                        .employeeId(faculty.getEmployeeId())
                        .designation(p.getDesignation())
                        .promotionDate(p.getPromotionDate())
                        .isProfessor(p.getIsProfessor())
                        .isAssociate(p.getIsAssociate())
                        .isAssistant(p.getIsAssistant())
                        .orderNumber(p.getOrderNumber())
                        .documentUrl(p.getDocumentUrl())
                        .remarks(p.getRemarks())
                        .createdAt(p.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        // Load research contributions
        List<FacultyResearchContributionDto> research = facultyResearchContributionRepository
                .findByFacultyIdOrderByCreatedAtDesc(facultyId).stream()
                .map(r -> FacultyResearchContributionDto.builder()
                        .id(r.getId())
                        .facultyId(facultyId)
                        .category(r.getCategory())
                        .title(r.getTitle())
                        .journalOrPublisherOrAgency(r.getJournalOrPublisherOrAgency())
                        .publicationDate(r.getPublicationDate())
                        .issnOrIsbnOrPatentNo(r.getIssnOrIsbnOrPatentNo())
                        .url(r.getUrl())
                        .documentUrl(r.getDocumentUrl())
                        .amount(r.getAmount())
                        .status(r.getStatus())
                        .remarks(r.getRemarks())
                        .createdAt(r.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        // Load resource persons
        List<FacultyResourcePersonDto> resourcePersons = facultyResourcePersonRepository
                .findByFacultyIdOrderByCreatedAtDesc(facultyId).stream()
                .map(rp -> FacultyResourcePersonDto.builder()
                        .id(rp.getId())
                        .facultyId(facultyId)
                        .resourceName(rp.getResourceName())
                        .orgType(rp.getOrgType())
                        .course(rp.getCourse())
                        .hours(rp.getHours())
                        .academicYear(rp.getAcademicYear())
                        .documentUrl(rp.getDocumentUrl())
                        .remarks(rp.getRemarks())
                        .createdAt(rp.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        UUID deptId = null;
        String deptName = "";
        if (user.getDepartment() != null) {
            deptId = user.getDepartment().getId();
            deptName = user.getDepartment().getName();
        } else if (faculty.getDepartments() != null && !faculty.getDepartments().isEmpty()) {
            deptId = faculty.getDepartments().get(0).getId();
            deptName = faculty.getDepartments().get(0).getName();
        }

        int finalTheoryHours = faculty.getTheoryLoadHours() != null && faculty.getTheoryLoadHours() > 0 
                ? faculty.getTheoryLoadHours() : calculatedTheoryHours;
        int finalLabHours = faculty.getLabLoadHours() != null && faculty.getLabLoadHours() > 0 
                ? faculty.getLabLoadHours() : calculatedLabHours;

        Map<String, Object> docs = new HashMap<>();
        if (user.getUploadedDocuments() != null) docs.putAll(user.getUploadedDocuments());
        if (faculty.getFacultyDocuments() != null) docs.putAll(faculty.getFacultyDocuments());

        return FacultyProfileDto.builder()
                .id(user.getId())
                .employeeId(faculty.getEmployeeId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .phone(canViewConfidential ? user.getPhone() : "")
                .role(user.getRole().name())
                .departmentId(deptId)
                .departmentName(deptName)
                .profilePictureUrl(user.getProfilePictureUrl())
                // Section 1: Personal & Employment
                .designation(faculty.getDesignation())
                .joiningDate(faculty.getJoiningDate())
                .employmentType(faculty.getEmploymentType())
                .pan(canViewConfidential ? faculty.getPan() : maskPan(faculty.getPan()))
                .aicteId(faculty.getAicteId())
                .rgpvId(faculty.getRgpvId())
                .highestQualification(faculty.getHighestQualification())
                .hasPhd(faculty.getHasPhd())
                .phdUniversity(faculty.getPhdUniversity())
                .phdAwardDate(faculty.getPhdAwardDate())
                .pgDetail(faculty.getPgDetail())
                .pgSpecialization(faculty.getPgSpecialization())
                .pgUniversity(faculty.getPgUniversity())
                .pgYear(faculty.getPgYear())
                .ugDetail(faculty.getUgDetail())
                .ugSpecialization(faculty.getUgSpecialization())
                .ugUniversity(faculty.getUgUniversity())
                .ugYear(faculty.getUgYear())
                .remarks(faculty.getRemarks())
                // Section 2: Experience & Retention
                .teachingExperienceYears(faculty.getTeachingExperienceYears() != null ? 
                        faculty.getTeachingExperienceYears() : 
                        (faculty.getExperienceYears() != null ? faculty.getExperienceYears().doubleValue() : 0.0))
                .industryExperienceYears(faculty.getIndustryExperienceYears())
                .aitrServiceYears(faculty.getAitrServiceYears())
                .currentDesignationSince(faculty.getCurrentDesignationSince())
                .previousInstitute(faculty.getPreviousInstitute())
                .retentionCategory(faculty.getRetentionCategory())
                // Section 4: Research Counts
                .sciCount(faculty.getSciCount() != null ? faculty.getSciCount() : 0)
                .scopusCount(faculty.getScopusCount() != null ? faculty.getScopusCount() : 0)
                .ugcCount(faculty.getUgcCount() != null ? faculty.getUgcCount() : 0)
                .booksCount(faculty.getBooksCount() != null ? faculty.getBooksCount() : 0)
                .bookChaptersCount(faculty.getBookChaptersCount() != null ? faculty.getBookChaptersCount() : 0)
                .patentsCount(faculty.getPatentsCount() != null ? faculty.getPatentsCount() : 0)
                .projectsCount(faculty.getProjectsCount() != null ? faculty.getProjectsCount() : 0)
                .consultancyCount(faculty.getConsultancyCount() != null ? faculty.getConsultancyCount() : 0)
                .googleScholarId(faculty.getGoogleScholarId())
                .orcidId(faculty.getOrcidId())
                .scopusId(faculty.getScopusId())
                // Section 6: Workload
                .theoryLoadHours(finalTheoryHours)
                .labLoadHours(finalLabHours)
                .totalTeachingLoadHours(finalTheoryHours + finalLabHours)
                .projectGuideDetails(faculty.getProjectGuideDetails())
                .mentoringDetails(faculty.getMentoringDetails())
                .adminDuties(faculty.getAdminDuties())
                // Collections
                .promotions(promotions)
                .researchContributions(research)
                .resourcePersons(resourcePersons)
                .assignedSubjects(assignedSubjectDtos)
                .documents(canViewConfidential ? docs : Collections.emptyMap())
                .build();
    }

    @Override
    @Transactional
    public FacultyProfileDto updateFacultyProfile(UUID facultyId, FacultyProfileDto dto, UserDetailsImpl actor) {
        validateEditAccess(facultyId, actor);

        User user = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty user not found"));

        Faculty faculty = facultyRepository.findById(facultyId).orElseGet(() -> {
            Faculty f = new Faculty();
            f.setId(user.getId());
            f.setUser(user);
            f.setEmployeeId("EMP-" + user.getId().toString().substring(0, 6).toUpperCase());
            f.setDesignation(user.getRole() == UserRole.HOD ? "HOD" : "Assistant Professor");
            f.markAsNew();
            return facultyRepository.save(f);
        });

        boolean privileged = isHodOrAdmin(actor);

        // Name and contact details
        if (dto.getFirstName() != null && !dto.getFirstName().trim().isEmpty()) {
            user.setFirstName(dto.getFirstName().trim());
        }
        if (dto.getLastName() != null) {
            user.setLastName(dto.getLastName().trim());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone().trim());
        }

        // Protected fields: Only HOD or Admin can change Emp ID, Dept, Designation, Retention Category
        if (privileged) {
            if (dto.getEmployeeId() != null && !dto.getEmployeeId().trim().isEmpty()) {
                faculty.setEmployeeId(dto.getEmployeeId().trim());
            }
            if (dto.getDesignation() != null && !dto.getDesignation().trim().isEmpty()) {
                faculty.setDesignation(dto.getDesignation().trim());
            }
            if (dto.getRetentionCategory() != null) {
                faculty.setRetentionCategory(dto.getRetentionCategory().trim());
            }
            if (dto.getDepartmentId() != null) {
                departmentRepository.findById(dto.getDepartmentId()).ifPresent(d -> {
                    user.setDepartment(d);
                    faculty.setDepartments(Collections.singletonList(d));
                });
            }
        }

        // Section 1: Personal & Employment (permitted fields)
        if (dto.getJoiningDate() != null) faculty.setJoiningDate(dto.getJoiningDate());
        if (dto.getEmploymentType() != null) faculty.setEmploymentType(dto.getEmploymentType());
        if (dto.getPan() != null && !dto.getPan().contains("*")) faculty.setPan(dto.getPan().toUpperCase().trim());
        if (dto.getAicteId() != null) faculty.setAicteId(dto.getAicteId().trim());
        if (dto.getRgpvId() != null) faculty.setRgpvId(dto.getRgpvId().trim());
        if (dto.getHighestQualification() != null) faculty.setHighestQualification(dto.getHighestQualification());
        if (dto.getHasPhd() != null) faculty.setHasPhd(dto.getHasPhd());
        if (dto.getPhdUniversity() != null) faculty.setPhdUniversity(dto.getPhdUniversity());
        if (dto.getPhdAwardDate() != null) faculty.setPhdAwardDate(dto.getPhdAwardDate());
        if (dto.getPgDetail() != null) faculty.setPgDetail(dto.getPgDetail());
        if (dto.getPgSpecialization() != null) faculty.setPgSpecialization(dto.getPgSpecialization());
        if (dto.getPgUniversity() != null) faculty.setPgUniversity(dto.getPgUniversity());
        if (dto.getPgYear() != null) faculty.setPgYear(dto.getPgYear());
        if (dto.getUgDetail() != null) faculty.setUgDetail(dto.getUgDetail());
        if (dto.getUgSpecialization() != null) faculty.setUgSpecialization(dto.getUgSpecialization());
        if (dto.getUgUniversity() != null) faculty.setUgUniversity(dto.getUgUniversity());
        if (dto.getUgYear() != null) faculty.setUgYear(dto.getUgYear());
        if (dto.getRemarks() != null) faculty.setRemarks(dto.getRemarks());

        // Section 2: Experience & Retention
        if (dto.getTeachingExperienceYears() != null) {
            faculty.setTeachingExperienceYears(dto.getTeachingExperienceYears());
            faculty.setExperienceYears(dto.getTeachingExperienceYears().intValue());
        }
        if (dto.getIndustryExperienceYears() != null) faculty.setIndustryExperienceYears(dto.getIndustryExperienceYears());
        if (dto.getAitrServiceYears() != null) faculty.setAitrServiceYears(dto.getAitrServiceYears());
        if (dto.getCurrentDesignationSince() != null) faculty.setCurrentDesignationSince(dto.getCurrentDesignationSince());
        if (dto.getPreviousInstitute() != null) faculty.setPreviousInstitute(dto.getPreviousInstitute());
        if (dto.getRetentionCategory() != null) faculty.setRetentionCategory(dto.getRetentionCategory());

        // Section 4: Research counts & IDs
        if (dto.getSciCount() != null) faculty.setSciCount(dto.getSciCount());
        if (dto.getScopusCount() != null) faculty.setScopusCount(dto.getScopusCount());
        if (dto.getUgcCount() != null) faculty.setUgcCount(dto.getUgcCount());
        if (dto.getBooksCount() != null) faculty.setBooksCount(dto.getBooksCount());
        if (dto.getBookChaptersCount() != null) faculty.setBookChaptersCount(dto.getBookChaptersCount());
        if (dto.getPatentsCount() != null) faculty.setPatentsCount(dto.getPatentsCount());
        if (dto.getProjectsCount() != null) faculty.setProjectsCount(dto.getProjectsCount());
        if (dto.getConsultancyCount() != null) faculty.setConsultancyCount(dto.getConsultancyCount());
        if (dto.getGoogleScholarId() != null) faculty.setGoogleScholarId(dto.getGoogleScholarId().trim());
        if (dto.getOrcidId() != null) faculty.setOrcidId(dto.getOrcidId().trim());
        if (dto.getScopusId() != null) faculty.setScopusId(dto.getScopusId().trim());

        // Section 6: Workload responsibilities
        if (dto.getTheoryLoadHours() != null) faculty.setTheoryLoadHours(dto.getTheoryLoadHours());
        if (dto.getLabLoadHours() != null) faculty.setLabLoadHours(dto.getLabLoadHours());
        if (dto.getProjectGuideDetails() != null) faculty.setProjectGuideDetails(dto.getProjectGuideDetails());
        if (dto.getMentoringDetails() != null) faculty.setMentoringDetails(dto.getMentoringDetails());
        if (dto.getAdminDuties() != null) faculty.setAdminDuties(dto.getAdminDuties());

        // Documents
        if (dto.getDocuments() != null) {
            Map<String, Object> currentDocs = faculty.getFacultyDocuments() != null ? 
                    new HashMap<>(faculty.getFacultyDocuments()) : new HashMap<>();
            currentDocs.putAll(dto.getDocuments());
            faculty.setFacultyDocuments(currentDocs);

            Map<String, Object> userDocs = user.getUploadedDocuments() != null ? 
                    new HashMap<>(user.getUploadedDocuments()) : new HashMap<>();
            userDocs.putAll(dto.getDocuments());
            user.setUploadedDocuments(userDocs);
        }

        userRepository.save(user);
        facultyRepository.save(faculty);

        return getFacultyProfile(facultyId, actor);
    }

    // ==========================================
    // PROMOTIONS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<FacultyPromotionDto> getPromotions(UUID facultyId, UserDetailsImpl actor) {
        validateViewAccess(facultyId, actor);
        User user = userRepository.findById(facultyId).orElseThrow(() -> new RuntimeException("Faculty not found"));
        Faculty faculty = facultyRepository.findById(facultyId).orElse(null);
        String empId = faculty != null ? faculty.getEmployeeId() : "";

        return facultyPromotionRepository.findByFacultyIdOrderByPromotionDateDesc(facultyId).stream()
                .map(p -> FacultyPromotionDto.builder()
                        .id(p.getId())
                        .facultyId(facultyId)
                        .facultyName(user.getFirstName() + " " + user.getLastName())
                        .employeeId(empId)
                        .designation(p.getDesignation())
                        .promotionDate(p.getPromotionDate())
                        .isProfessor(p.getIsProfessor())
                        .isAssociate(p.getIsAssociate())
                        .isAssistant(p.getIsAssistant())
                        .orderNumber(p.getOrderNumber())
                        .documentUrl(p.getDocumentUrl())
                        .remarks(p.getRemarks())
                        .createdAt(p.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacultyPromotionDto addPromotion(UUID facultyId, FacultyPromotionDto dto, UserDetailsImpl actor) {
        if (!isHodOrAdmin(actor)) {
            throw new AccessDeniedException("Only HOD or Admin can add promotion records");
        }

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        FacultyPromotion promo = FacultyPromotion.builder()
                .faculty(faculty)
                .designation(dto.getDesignation() != null ? dto.getDesignation().trim() : "Assistant Professor")
                .promotionDate(dto.getPromotionDate() != null ? dto.getPromotionDate() : LocalDate.now())
                .isProfessor(dto.getIsProfessor() != null ? dto.getIsProfessor() : false)
                .isAssociate(dto.getIsAssociate() != null ? dto.getIsAssociate() : false)
                .isAssistant(dto.getIsAssistant() != null ? dto.getIsAssistant() : false)
                .orderNumber(dto.getOrderNumber())
                .documentUrl(dto.getDocumentUrl())
                .remarks(dto.getRemarks())
                .build();

        FacultyPromotion saved = facultyPromotionRepository.save(promo);

        // Update current designation on faculty if newer
        if (dto.getDesignation() != null && !dto.getDesignation().trim().isEmpty()) {
            faculty.setDesignation(dto.getDesignation().trim());
            if (dto.getPromotionDate() != null) {
                faculty.setCurrentDesignationSince(dto.getPromotionDate());
            }
            facultyRepository.save(faculty);
        }

        return FacultyPromotionDto.builder()
                .id(saved.getId())
                .facultyId(facultyId)
                .facultyName(faculty.getUser().getFirstName() + " " + faculty.getUser().getLastName())
                .employeeId(faculty.getEmployeeId())
                .designation(saved.getDesignation())
                .promotionDate(saved.getPromotionDate())
                .isProfessor(saved.getIsProfessor())
                .isAssociate(saved.getIsAssociate())
                .isAssistant(saved.getIsAssistant())
                .orderNumber(saved.getOrderNumber())
                .documentUrl(saved.getDocumentUrl())
                .remarks(saved.getRemarks())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public FacultyPromotionDto updatePromotion(UUID facultyId, UUID promotionId, FacultyPromotionDto dto, UserDetailsImpl actor) {
        if (!isHodOrAdmin(actor)) {
            throw new AccessDeniedException("Only HOD or Admin can update promotion records");
        }
        FacultyPromotion promo = facultyPromotionRepository.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion record not found"));

        if (!promo.getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("Promotion record does not belong to specified faculty");
        }

        if (dto.getDesignation() != null) promo.setDesignation(dto.getDesignation().trim());
        if (dto.getPromotionDate() != null) promo.setPromotionDate(dto.getPromotionDate());
        if (dto.getIsProfessor() != null) promo.setIsProfessor(dto.getIsProfessor());
        if (dto.getIsAssociate() != null) promo.setIsAssociate(dto.getIsAssociate());
        if (dto.getIsAssistant() != null) promo.setIsAssistant(dto.getIsAssistant());
        if (dto.getOrderNumber() != null) promo.setOrderNumber(dto.getOrderNumber());
        if (dto.getDocumentUrl() != null) promo.setDocumentUrl(dto.getDocumentUrl());
        if (dto.getRemarks() != null) promo.setRemarks(dto.getRemarks());

        FacultyPromotion saved = facultyPromotionRepository.save(promo);
        return FacultyPromotionDto.builder()
                .id(saved.getId())
                .facultyId(facultyId)
                .designation(saved.getDesignation())
                .promotionDate(saved.getPromotionDate())
                .isProfessor(saved.getIsProfessor())
                .isAssociate(saved.getIsAssociate())
                .isAssistant(saved.getIsAssistant())
                .orderNumber(saved.getOrderNumber())
                .documentUrl(saved.getDocumentUrl())
                .remarks(saved.getRemarks())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deletePromotion(UUID facultyId, UUID promotionId, UserDetailsImpl actor) {
        if (!isHodOrAdmin(actor)) {
            throw new AccessDeniedException("Only HOD or Admin can delete promotion records");
        }
        FacultyPromotion promo = facultyPromotionRepository.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion record not found"));
        facultyPromotionRepository.delete(promo);
    }

    // ==========================================
    // RESEARCH CONTRIBUTIONS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<FacultyResearchContributionDto> getResearchContributions(UUID facultyId, UserDetailsImpl actor) {
        validateViewAccess(facultyId, actor);
        return facultyResearchContributionRepository.findByFacultyIdOrderByCreatedAtDesc(facultyId).stream()
                .map(r -> FacultyResearchContributionDto.builder()
                        .id(r.getId())
                        .facultyId(facultyId)
                        .category(r.getCategory())
                        .title(r.getTitle())
                        .journalOrPublisherOrAgency(r.getJournalOrPublisherOrAgency())
                        .publicationDate(r.getPublicationDate())
                        .issnOrIsbnOrPatentNo(r.getIssnOrIsbnOrPatentNo())
                        .url(r.getUrl())
                        .documentUrl(r.getDocumentUrl())
                        .amount(r.getAmount())
                        .status(r.getStatus())
                        .remarks(r.getRemarks())
                        .createdAt(r.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacultyResearchContributionDto addResearchContribution(UUID facultyId, FacultyResearchContributionDto dto, UserDetailsImpl actor) {
        validateEditAccess(facultyId, actor);

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        FacultyResearchContribution item = FacultyResearchContribution.builder()
                .faculty(faculty)
                .category(dto.getCategory() != null ? dto.getCategory().toUpperCase() : "SCI")
                .title(dto.getTitle() != null ? dto.getTitle().trim() : "Untitled Contribution")
                .journalOrPublisherOrAgency(dto.getJournalOrPublisherOrAgency())
                .publicationDate(dto.getPublicationDate())
                .issnOrIsbnOrPatentNo(dto.getIssnOrIsbnOrPatentNo())
                .url(dto.getUrl())
                .documentUrl(dto.getDocumentUrl())
                .amount(dto.getAmount())
                .status(dto.getStatus() != null ? dto.getStatus() : "Published")
                .remarks(dto.getRemarks())
                .build();

        FacultyResearchContribution saved = facultyResearchContributionRepository.save(item);

        // Update counts
        updateResearchCounts(faculty);

        return FacultyResearchContributionDto.builder()
                .id(saved.getId())
                .facultyId(facultyId)
                .category(saved.getCategory())
                .title(saved.getTitle())
                .journalOrPublisherOrAgency(saved.getJournalOrPublisherOrAgency())
                .publicationDate(saved.getPublicationDate())
                .issnOrIsbnOrPatentNo(saved.getIssnOrIsbnOrPatentNo())
                .url(saved.getUrl())
                .documentUrl(saved.getDocumentUrl())
                .amount(saved.getAmount())
                .status(saved.getStatus())
                .remarks(saved.getRemarks())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteResearchContribution(UUID facultyId, UUID contributionId, UserDetailsImpl actor) {
        validateEditAccess(facultyId, actor);
        FacultyResearchContribution item = facultyResearchContributionRepository.findById(contributionId)
                .orElseThrow(() -> new RuntimeException("Research contribution not found"));
        facultyResearchContributionRepository.delete(item);

        Faculty faculty = facultyRepository.findById(facultyId).orElse(null);
        if (faculty != null) {
            updateResearchCounts(faculty);
        }
    }

    private void updateResearchCounts(Faculty faculty) {
        List<FacultyResearchContribution> all = facultyResearchContributionRepository
                .findByFacultyIdOrderByCreatedAtDesc(faculty.getId());
        
        int sci = 0, scopus = 0, ugc = 0, books = 0, chapters = 0, patents = 0, projects = 0, consultancy = 0;
        for (FacultyResearchContribution r : all) {
            String cat = r.getCategory() != null ? r.getCategory().toUpperCase() : "";
            if (cat.contains("SCI")) sci++;
            else if (cat.contains("SCOPUS")) scopus++;
            else if (cat.contains("UGC")) ugc++;
            else if (cat.equals("BOOK")) books++;
            else if (cat.contains("CHAPTER")) chapters++;
            else if (cat.contains("PATENT")) patents++;
            else if (cat.contains("PROJECT")) projects++;
            else if (cat.contains("CONSULTANCY")) consultancy++;
        }
        if (faculty.getSciCount() == null || faculty.getSciCount() < sci) faculty.setSciCount(sci);
        if (faculty.getScopusCount() == null || faculty.getScopusCount() < scopus) faculty.setScopusCount(scopus);
        if (faculty.getUgcCount() == null || faculty.getUgcCount() < ugc) faculty.setUgcCount(ugc);
        if (faculty.getBooksCount() == null || faculty.getBooksCount() < books) faculty.setBooksCount(books);
        if (faculty.getBookChaptersCount() == null || faculty.getBookChaptersCount() < chapters) faculty.setBookChaptersCount(chapters);
        if (faculty.getPatentsCount() == null || faculty.getPatentsCount() < patents) faculty.setPatentsCount(patents);
        if (faculty.getProjectsCount() == null || faculty.getProjectsCount() < projects) faculty.setProjectsCount(projects);
        if (faculty.getConsultancyCount() == null || faculty.getConsultancyCount() < consultancy) faculty.setConsultancyCount(consultancy);
        facultyRepository.save(faculty);
    }

    // ==========================================
    // RESOURCE PERSONS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<FacultyResourcePersonDto> getResourcePersons(UUID facultyId, UserDetailsImpl actor) {
        validateViewAccess(facultyId, actor);
        return facultyResourcePersonRepository.findByFacultyIdOrderByCreatedAtDesc(facultyId).stream()
                .map(rp -> FacultyResourcePersonDto.builder()
                        .id(rp.getId())
                        .facultyId(facultyId)
                        .resourceName(rp.getResourceName())
                        .orgType(rp.getOrgType())
                        .course(rp.getCourse())
                        .hours(rp.getHours())
                        .academicYear(rp.getAcademicYear())
                        .documentUrl(rp.getDocumentUrl())
                        .remarks(rp.getRemarks())
                        .createdAt(rp.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacultyResourcePersonDto addResourcePerson(UUID facultyId, FacultyResourcePersonDto dto, UserDetailsImpl actor) {
        validateEditAccess(facultyId, actor);

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        FacultyResourcePerson item = FacultyResourcePerson.builder()
                .faculty(faculty)
                .resourceName(dto.getResourceName() != null ? dto.getResourceName().trim() : "Resource Person Activity")
                .orgType(dto.getOrgType())
                .course(dto.getCourse())
                .hours(dto.getHours() != null ? dto.getHours() : 0)
                .academicYear(dto.getAcademicYear())
                .documentUrl(dto.getDocumentUrl())
                .remarks(dto.getRemarks())
                .build();

        FacultyResourcePerson saved = facultyResourcePersonRepository.save(item);
        return FacultyResourcePersonDto.builder()
                .id(saved.getId())
                .facultyId(facultyId)
                .resourceName(saved.getResourceName())
                .orgType(saved.getOrgType())
                .course(saved.getCourse())
                .hours(saved.getHours())
                .academicYear(saved.getAcademicYear())
                .documentUrl(saved.getDocumentUrl())
                .remarks(saved.getRemarks())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteResourcePerson(UUID facultyId, UUID resourcePersonId, UserDetailsImpl actor) {
        validateEditAccess(facultyId, actor);
        FacultyResourcePerson item = facultyResourcePersonRepository.findById(resourcePersonId)
                .orElseThrow(() -> new RuntimeException("Resource person record not found"));
        facultyResourcePersonRepository.delete(item);
    }

    // ==========================================
    // WORKLOAD & RESPONSIBILITIES
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public FacultyWorkloadDto getWorkload(UUID facultyId, UserDetailsImpl actor) {
        validateViewAccess(facultyId, actor);

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(facultyId);
        int calcTheory = 0;
        int calcLab = 0;

        List<AssignedSubjectDto> dtos = new ArrayList<>();
        for (ClassSubject cs : classSubjects) {
            AssignedSubjectDto dto = new AssignedSubjectDto();
            dto.setId(cs.getId());
            dto.setFacultyId(facultyId);
            if (cs.getSubject() != null) dto.setSubjectName(cs.getSubject().getName());
            if (cs.getAcroClass() != null) dto.setClassName(cs.getAcroClass().getFunctionalClassName());
            if (cs.getSemester() != null) {
                dto.setSemester(cs.getSemester().getSemesterNumber() != null ? 
                    "Semester " + cs.getSemester().getSemesterNumber() : "Unknown");
            }
            if (cs.getAcademicYear() != null) dto.setAcademicYear(cs.getAcademicYear().getYear());
            if (cs.getSyllabusSubject() != null) {
                if (cs.getSyllabusSubject().getTheoryHours() != null) {
                    calcTheory += cs.getSyllabusSubject().getTheoryHours();
                }
                if (cs.getSyllabusSubject().getPracticalHours() != null) {
                    calcLab += cs.getSyllabusSubject().getPracticalHours();
                }
            }
            dtos.add(dto);
        }

        return FacultyWorkloadDto.builder()
                .facultyId(facultyId)
                .facultyName(faculty.getUser().getFirstName() + " " + faculty.getUser().getLastName())
                .employeeId(faculty.getEmployeeId())
                .assignedSubjects(dtos)
                .calculatedTheoryHours(calcTheory)
                .calculatedLabHours(calcLab)
                .calculatedTotalHours(calcTheory + calcLab)
                .customTheoryHours(faculty.getTheoryLoadHours())
                .customLabHours(faculty.getLabLoadHours())
                .projectGuideDetails(faculty.getProjectGuideDetails())
                .mentoringDetails(faculty.getMentoringDetails())
                .adminDuties(faculty.getAdminDuties())
                .build();
    }

    @Override
    @Transactional
    public FacultyWorkloadDto updateWorkload(UUID facultyId, FacultyWorkloadDto dto, UserDetailsImpl actor) {
        validateEditAccess(facultyId, actor);

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        if (dto.getCustomTheoryHours() != null) faculty.setTheoryLoadHours(dto.getCustomTheoryHours());
        if (dto.getCustomLabHours() != null) faculty.setLabLoadHours(dto.getCustomLabHours());
        if (dto.getProjectGuideDetails() != null) faculty.setProjectGuideDetails(dto.getProjectGuideDetails());
        if (dto.getMentoringDetails() != null) faculty.setMentoringDetails(dto.getMentoringDetails());
        if (dto.getAdminDuties() != null) faculty.setAdminDuties(dto.getAdminDuties());

        facultyRepository.save(faculty);
        return getWorkload(facultyId, actor);
    }

    // ==========================================
    // CLASS & DEPARTMENT STRENGTH
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<ClassStrengthDto> getClassStrengths(UUID departmentId, String academicYear, Integer semesterNumber, UserDetailsImpl actor) {
        if (isStudent(actor)) {
            throw new AccessDeniedException("Students are not permitted to view class strength records");
        }

        // Determine department: if departmentId not provided, use actor's department
        UUID targetDeptId = departmentId;
        if (targetDeptId == null) {
            User actorUser = userRepository.findById(actor.getId()).orElse(null);
            if (actorUser != null && actorUser.getDepartment() != null) {
                targetDeptId = actorUser.getDepartment().getId();
            }
        }

        List<AcroClass> classes = (targetDeptId != null) 
                ? acroClassRepository.findByDepartmentId(targetDeptId)
                : acroClassRepository.findAll();

        classes = classes.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()) && !Boolean.TRUE.equals(c.getIsDeleted()))
                .collect(Collectors.toList());

        List<UUID> classIds = classes.stream().map(BaseEntity::getId).collect(Collectors.toList());
        List<ClassStrength> existingRecords = classStrengthRepository.findByAcroClassIdIn(classIds);
        Map<UUID, ClassStrength> strengthMap = existingRecords.stream()
                .collect(Collectors.toMap(cs -> cs.getAcroClass().getId(), cs -> cs, (a, b) -> a));

        List<ClassStrengthDto> result = new ArrayList<>();
        for (AcroClass ac : classes) {
            long actual = studentEnrollmentRepository.countByAcroClassIdAndIsActiveTrue(ac.getId());
            ClassStrength record = strengthMap.get(ac.getId());

            int sanctioned = (record != null && record.getSanctionedIntake() != null) ? record.getSanctionedIntake() : 60;
            int lateral = (record != null && record.getLateralEntryCount() != null) ? record.getLateralEntryCount() : 0;
            int supernumerary = (record != null && record.getSupernumeraryCount() != null) ? record.getSupernumeraryCount() : 0;
            int detained = (record != null && record.getDetainedCount() != null) ? record.getDetainedCount() : 0;
            String remarks = (record != null) ? record.getRemarks() : "";

            UUID semId = record != null && record.getSemester() != null ? record.getSemester().getId() : null;
            Integer semNum = record != null && record.getSemester() != null ? record.getSemester().getSemesterNumber() : null;
            String semName = semNum != null ? "Semester " + semNum : "Current Semester";
            String ay = record != null && record.getAcademicYear() != null ? record.getAcademicYear().getYear() : "2024-2025";

            ClassStrengthDto dto = ClassStrengthDto.builder()
                    .id(record != null ? record.getId() : null)
                    .departmentId(ac.getDepartment() != null ? ac.getDepartment().getId() : null)
                    .departmentName(ac.getDepartment() != null ? ac.getDepartment().getName() : "General")
                    .classId(ac.getId())
                    .className(ac.getName())
                    .section(ac.getSection() != null ? ac.getSection() : "A")
                    .semesterId(semId)
                    .semesterNumber(semNum)
                    .semesterName(semName)
                    .academicYearId(record != null && record.getAcademicYear() != null ? record.getAcademicYear().getId() : null)
                    .academicYear(ay)
                    .sanctionedIntake(sanctioned)
                    .actualStrength(actual)
                    .lateralEntryCount(lateral)
                    .supernumeraryCount(supernumerary)
                    .detainedCount(detained)
                    .remarks(remarks)
                    .build();

            result.add(dto);
        }

        // Sort by class name and section
        result.sort(Comparator.comparing(ClassStrengthDto::getClassName, Comparator.nullsLast(String::compareTo))
                .thenComparing(ClassStrengthDto::getSection, Comparator.nullsLast(String::compareTo)));

        return result;
    }

    @Override
    @Transactional
    public ClassStrengthDto updateClassStrength(ClassStrengthDto dto, UserDetailsImpl actor) {
        if (!isHodOrAdmin(actor)) {
            throw new AccessDeniedException("Only HOD or Admin can update class strength configuration");
        }

        if (dto.getClassId() == null) {
            throw new IllegalArgumentException("Class ID is required");
        }

        AcroClass acroClass = acroClassRepository.findById(dto.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        ClassStrength record = classStrengthRepository.findByAcroClassId(acroClass.getId())
                .orElseGet(() -> {
                    ClassStrength cs = new ClassStrength();
                    cs.setAcroClass(acroClass);
                    cs.setDepartment(acroClass.getDepartment());
                    return cs;
                });

        if (dto.getSanctionedIntake() != null) record.setSanctionedIntake(dto.getSanctionedIntake());
        if (dto.getLateralEntryCount() != null) record.setLateralEntryCount(dto.getLateralEntryCount());
        if (dto.getSupernumeraryCount() != null) record.setSupernumeraryCount(dto.getSupernumeraryCount());
        if (dto.getDetainedCount() != null) record.setDetainedCount(dto.getDetainedCount());
        if (dto.getRemarks() != null) record.setRemarks(dto.getRemarks());

        if (dto.getSemesterId() != null) {
            semesterRepository.findById(dto.getSemesterId()).ifPresent(record::setSemester);
        }
        if (dto.getAcademicYearId() != null) {
            academicYearRepository.findById(dto.getAcademicYearId()).ifPresent(record::setAcademicYear);
        }

        ClassStrength saved = classStrengthRepository.save(record);
        long actual = studentEnrollmentRepository.countByAcroClassIdAndIsActiveTrue(acroClass.getId());

        return ClassStrengthDto.builder()
                .id(saved.getId())
                .departmentId(acroClass.getDepartment() != null ? acroClass.getDepartment().getId() : null)
                .departmentName(acroClass.getDepartment() != null ? acroClass.getDepartment().getName() : "")
                .classId(acroClass.getId())
                .className(acroClass.getName())
                .section(acroClass.getSection())
                .semesterId(saved.getSemester() != null ? saved.getSemester().getId() : null)
                .semesterNumber(saved.getSemester() != null ? saved.getSemester().getSemesterNumber() : null)
                .semesterName(saved.getSemester() != null && saved.getSemester().getSemesterNumber() != null ? 
                        "Semester " + saved.getSemester().getSemesterNumber() : "")
                .academicYearId(saved.getAcademicYear() != null ? saved.getAcademicYear().getId() : null)
                .academicYear(saved.getAcademicYear() != null ? saved.getAcademicYear().getYear() : "")
                .sanctionedIntake(saved.getSanctionedIntake())
                .actualStrength(actual)
                .lateralEntryCount(saved.getLateralEntryCount())
                .supernumeraryCount(saved.getSupernumeraryCount())
                .detainedCount(saved.getDetainedCount())
                .remarks(saved.getRemarks())
                .build();
    }

    // ==========================================
    // HOD DEPARTMENT FACULTY REPORTS & EXPORTS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<FacultyProfileDto> getDepartmentFacultyProfiles(UserDetailsImpl actor) {
        if (!isHodOrAdmin(actor)) {
            throw new AccessDeniedException("Access denied: Only HOD or Admin can access department faculty reports");
        }

        List<Department> managedDepts = departmentRepository.findByHodId(actor.getId());
        List<UUID> deptIds = new ArrayList<>();
        if (managedDepts != null && !managedDepts.isEmpty()) {
            deptIds.addAll(managedDepts.stream().map(Department::getId).toList());
        }

        User hodUser = userRepository.findById(actor.getId()).orElse(null);
        if (hodUser != null && hodUser.getDepartment() != null && !deptIds.contains(hodUser.getDepartment().getId())) {
            deptIds.add(hodUser.getDepartment().getId());
        }

        if (deptIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Faculty> faculties = facultyRepository.findDepartmentFaculties(deptIds);
        List<FacultyProfileDto> result = new ArrayList<>();
        for (Faculty f : faculties) {
            try {
                result.add(getFacultyProfile(f.getId(), actor));
            } catch (Exception e) {
                log.warn("Failed to load profile for faculty {}: {}", f.getId(), e.getMessage());
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportDepartmentFacultyExcel(UserDetailsImpl actor) {
        List<FacultyProfileDto> profiles = getDepartmentFacultyProfiles(actor);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Header Style
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 10);
            headerFont.setFontName("Calibri");

            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 30, (byte) 58, (byte) 138}, null)); // Indigo #1E3A8A
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);

            // Data Style
            XSSFFont dataFont = workbook.createFont();
            dataFont.setFontHeightInPoints((short) 9);
            dataFont.setFontName("Calibri");

            XSSFCellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setFont(dataFont);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());

            // 1. SHEET: Faculty Summary
            XSSFSheet sheetSummary = workbook.createSheet("Faculty Summary");
            sheetSummary.createFreezePane(0, 1);
            String[] summaryHeaders = {"S.No.", "Employee ID", "Faculty Name", "Official Email", "Phone", "Designation", "Role", "Department", "Joining Date", "Highest Qualification", "Experience (Years)", "Retention Category"};
            createHeaderRow(sheetSummary, summaryHeaders, headerStyle);
            int rowIdx1 = 1;
            for (FacultyProfileDto p : profiles) {
                Row row = sheetSummary.createRow(rowIdx1);
                createCell(row, 0, String.valueOf(rowIdx1), dataStyle);
                createCell(row, 1, p.getEmployeeId(), dataStyle);
                createCell(row, 2, p.getFullName(), dataStyle);
                createCell(row, 3, p.getEmail(), dataStyle);
                createCell(row, 4, p.getPhone(), dataStyle);
                createCell(row, 5, p.getDesignation(), dataStyle);
                createCell(row, 6, p.getRole(), dataStyle);
                createCell(row, 7, p.getDepartmentName(), dataStyle);
                createCell(row, 8, p.getJoiningDate() != null ? p.getJoiningDate().toString() : "-", dataStyle);
                createCell(row, 9, p.getHighestQualification(), dataStyle);
                createCell(row, 10, p.getTeachingExperienceYears() != null ? String.valueOf(p.getTeachingExperienceYears()) : "-", dataStyle);
                createCell(row, 11, p.getRetentionCategory(), dataStyle);
                rowIdx1++;
            }
            autoSizeColumns(sheetSummary, summaryHeaders.length);

            // 2. SHEET: Personal & Employment
            XSSFSheet sheetPersonal = workbook.createSheet("Personal & Employment");
            sheetPersonal.createFreezePane(0, 1);
            String[] personalHeaders = {"S.No.", "Employee ID", "Faculty Name", "Department", "Designation", "Employment Type", "DOJ", "PAN", "AICTE ID", "RGPV ID", "Official Email", "Phone", "Highest Qualification", "Remarks"};
            createHeaderRow(sheetPersonal, personalHeaders, headerStyle);
            int rowIdx2 = 1;
            for (FacultyProfileDto p : profiles) {
                Row row = sheetPersonal.createRow(rowIdx2);
                createCell(row, 0, String.valueOf(rowIdx2), dataStyle);
                createCell(row, 1, p.getEmployeeId(), dataStyle);
                createCell(row, 2, p.getFullName(), dataStyle);
                createCell(row, 3, p.getDepartmentName(), dataStyle);
                createCell(row, 4, p.getDesignation(), dataStyle);
                createCell(row, 5, p.getEmploymentType(), dataStyle);
                createCell(row, 6, p.getJoiningDate() != null ? p.getJoiningDate().toString() : "-", dataStyle);
                createCell(row, 7, maskPan(p.getPan()), dataStyle);
                createCell(row, 8, p.getAicteId(), dataStyle);
                createCell(row, 9, p.getRgpvId(), dataStyle);
                createCell(row, 10, p.getEmail(), dataStyle);
                createCell(row, 11, p.getPhone(), dataStyle);
                createCell(row, 12, p.getHighestQualification(), dataStyle);
                createCell(row, 13, p.getRemarks(), dataStyle);
                rowIdx2++;
            }
            autoSizeColumns(sheetPersonal, personalHeaders.length);

            // 3. SHEET: Qualifications
            XSSFSheet sheetQual = workbook.createSheet("Qualifications");
            sheetQual.createFreezePane(0, 1);
            String[] qualHeaders = {"S.No.", "Employee ID", "Faculty Name", "Highest Qual", "PhD Completed", "PhD University", "PhD Award Date", "PG Specialization", "PG University", "PG Year", "UG Specialization", "UG University", "UG Year"};
            createHeaderRow(sheetQual, qualHeaders, headerStyle);
            int rowIdx3 = 1;
            for (FacultyProfileDto p : profiles) {
                Row row = sheetQual.createRow(rowIdx3);
                createCell(row, 0, String.valueOf(rowIdx3), dataStyle);
                createCell(row, 1, p.getEmployeeId(), dataStyle);
                createCell(row, 2, p.getFullName(), dataStyle);
                createCell(row, 3, p.getHighestQualification(), dataStyle);
                createCell(row, 4, Boolean.TRUE.equals(p.getHasPhd()) ? "Yes" : "No", dataStyle);
                createCell(row, 5, p.getPhdUniversity(), dataStyle);
                createCell(row, 6, p.getPhdAwardDate() != null ? p.getPhdAwardDate().toString() : "-", dataStyle);
                createCell(row, 7, p.getPgSpecialization(), dataStyle);
                createCell(row, 8, p.getPgUniversity(), dataStyle);
                createCell(row, 9, p.getPgYear() != null ? String.valueOf(p.getPgYear()) : "-", dataStyle);
                createCell(row, 10, p.getUgSpecialization(), dataStyle);
                createCell(row, 11, p.getUgUniversity(), dataStyle);
                createCell(row, 12, p.getUgYear() != null ? String.valueOf(p.getUgYear()) : "-", dataStyle);
                rowIdx3++;
            }
            autoSizeColumns(sheetQual, qualHeaders.length);

            // 4. SHEET: Experience & Retention
            XSSFSheet sheetExp = workbook.createSheet("Experience & Retention");
            sheetExp.createFreezePane(0, 1);
            String[] expHeaders = {"S.No.", "Employee ID", "Faculty Name", "Teaching Exp (Yrs)", "Industry Exp (Yrs)", "AITR Service (Yrs)", "Current Desig Since", "Previous Institute", "Retention Category"};
            createHeaderRow(sheetExp, expHeaders, headerStyle);
            int rowIdx4 = 1;
            for (FacultyProfileDto p : profiles) {
                Row row = sheetExp.createRow(rowIdx4);
                createCell(row, 0, String.valueOf(rowIdx4), dataStyle);
                createCell(row, 1, p.getEmployeeId(), dataStyle);
                createCell(row, 2, p.getFullName(), dataStyle);
                createCell(row, 3, p.getTeachingExperienceYears() != null ? String.valueOf(p.getTeachingExperienceYears()) : "0", dataStyle);
                createCell(row, 4, p.getIndustryExperienceYears() != null ? String.valueOf(p.getIndustryExperienceYears()) : "0", dataStyle);
                createCell(row, 5, p.getAitrServiceYears() != null ? String.valueOf(p.getAitrServiceYears()) : "0", dataStyle);
                createCell(row, 6, p.getCurrentDesignationSince() != null ? p.getCurrentDesignationSince().toString() : "-", dataStyle);
                createCell(row, 7, p.getPreviousInstitute(), dataStyle);
                createCell(row, 8, p.getRetentionCategory(), dataStyle);
                rowIdx4++;
            }
            autoSizeColumns(sheetExp, expHeaders.length);

            // 5. SHEET: Promotion History
            XSSFSheet sheetProm = workbook.createSheet("Promotion History");
            sheetProm.createFreezePane(0, 1);
            String[] promHeaders = {"S.No.", "Employee ID", "Faculty Name", "Promoted Designation", "Promotion Date", "Prof (Y/N)", "Assoc (Y/N)", "Assist (Y/N)", "Order / Ref No.", "Remarks"};
            createHeaderRow(sheetProm, promHeaders, headerStyle);
            int rowIdx5 = 1;
            for (FacultyProfileDto p : profiles) {
                if (p.getPromotions() != null && !p.getPromotions().isEmpty()) {
                    for (FacultyPromotionDto pr : p.getPromotions()) {
                        Row row = sheetProm.createRow(rowIdx5);
                        createCell(row, 0, String.valueOf(rowIdx5), dataStyle);
                        createCell(row, 1, p.getEmployeeId(), dataStyle);
                        createCell(row, 2, p.getFullName(), dataStyle);
                        createCell(row, 3, pr.getDesignation(), dataStyle);
                        createCell(row, 4, pr.getPromotionDate() != null ? pr.getPromotionDate().toString() : "-", dataStyle);
                        createCell(row, 5, Boolean.TRUE.equals(pr.getIsProfessor()) ? "Y" : "N", dataStyle);
                        createCell(row, 6, Boolean.TRUE.equals(pr.getIsAssociate()) ? "Y" : "N", dataStyle);
                        createCell(row, 7, Boolean.TRUE.equals(pr.getIsAssistant()) ? "Y" : "N", dataStyle);
                        createCell(row, 8, pr.getOrderNumber(), dataStyle);
                        createCell(row, 9, pr.getRemarks(), dataStyle);
                        rowIdx5++;
                    }
                }
            }
            if (rowIdx5 == 1) {
                Row emptyRow = sheetProm.createRow(1);
                createCell(emptyRow, 0, "-", dataStyle);
                createCell(emptyRow, 1, "-", dataStyle);
                createCell(emptyRow, 2, "No promotion records registered", dataStyle);
            }
            autoSizeColumns(sheetProm, promHeaders.length);

            // 6. SHEET: Research & Publications
            XSSFSheet sheetResearch = workbook.createSheet("Research & Publications");
            sheetResearch.createFreezePane(0, 1);
            String[] researchHeaders = {"S.No.", "Employee ID", "Faculty Name", "Category", "Title", "Journal / Publisher / Agency", "Publication Date", "ISSN / ISBN / Patent No", "Amount (INR)", "Status", "Remarks"};
            createHeaderRow(sheetResearch, researchHeaders, headerStyle);
            int rowIdx6 = 1;
            for (FacultyProfileDto p : profiles) {
                if (p.getResearchContributions() != null && !p.getResearchContributions().isEmpty()) {
                    for (FacultyResearchContributionDto rc : p.getResearchContributions()) {
                        Row row = sheetResearch.createRow(rowIdx6);
                        createCell(row, 0, String.valueOf(rowIdx6), dataStyle);
                        createCell(row, 1, p.getEmployeeId(), dataStyle);
                        createCell(row, 2, p.getFullName(), dataStyle);
                        createCell(row, 3, rc.getCategory(), dataStyle);
                        createCell(row, 4, rc.getTitle(), dataStyle);
                        createCell(row, 5, rc.getJournalOrPublisherOrAgency(), dataStyle);
                        createCell(row, 6, rc.getPublicationDate() != null ? rc.getPublicationDate().toString() : "-", dataStyle);
                        createCell(row, 7, rc.getIssnOrIsbnOrPatentNo(), dataStyle);
                        createCell(row, 8, rc.getAmount() != null ? String.valueOf(rc.getAmount()) : "0", dataStyle);
                        createCell(row, 9, rc.getStatus(), dataStyle);
                        createCell(row, 10, rc.getRemarks(), dataStyle);
                        rowIdx6++;
                    }
                }
            }
            if (rowIdx6 == 1) {
                Row emptyRow = sheetResearch.createRow(1);
                createCell(emptyRow, 0, "-", dataStyle);
                createCell(emptyRow, 1, "-", dataStyle);
                createCell(emptyRow, 2, "No research contributions recorded", dataStyle);
            }
            autoSizeColumns(sheetResearch, researchHeaders.length);

            // 7. SHEET: Resource Person Records
            XSSFSheet sheetResource = workbook.createSheet("Resource Person Records");
            sheetResource.createFreezePane(0, 1);
            String[] resourceHeaders = {"S.No.", "Employee ID", "Faculty Name", "Resource / Event Name", "Organization Type", "Course / Topic", "Hours", "Academic Year", "Remarks"};
            createHeaderRow(sheetResource, resourceHeaders, headerStyle);
            int rowIdx7 = 1;
            for (FacultyProfileDto p : profiles) {
                if (p.getResourcePersons() != null && !p.getResourcePersons().isEmpty()) {
                    for (FacultyResourcePersonDto rp : p.getResourcePersons()) {
                        Row row = sheetResource.createRow(rowIdx7);
                        createCell(row, 0, String.valueOf(rowIdx7), dataStyle);
                        createCell(row, 1, p.getEmployeeId(), dataStyle);
                        createCell(row, 2, p.getFullName(), dataStyle);
                        createCell(row, 3, rp.getResourceName(), dataStyle);
                        createCell(row, 4, rp.getOrgType(), dataStyle);
                        createCell(row, 5, rp.getCourse(), dataStyle);
                        createCell(row, 6, rp.getHours() != null ? String.valueOf(rp.getHours()) : "0", dataStyle);
                        createCell(row, 7, rp.getAcademicYear(), dataStyle);
                        createCell(row, 8, rp.getRemarks(), dataStyle);
                        rowIdx7++;
                    }
                }
            }
            if (rowIdx7 == 1) {
                Row emptyRow = sheetResource.createRow(1);
                createCell(emptyRow, 0, "-", dataStyle);
                createCell(emptyRow, 1, "-", dataStyle);
                createCell(emptyRow, 2, "No resource person records registered", dataStyle);
            }
            autoSizeColumns(sheetResource, resourceHeaders.length);

            // 8. SHEET: Teaching Workload
            XSSFSheet sheetWorkload = workbook.createSheet("Teaching Workload");
            sheetWorkload.createFreezePane(0, 1);
            String[] workloadHeaders = {"S.No.", "Employee ID", "Faculty Name", "Theory Load (Hrs)", "Lab Load (Hrs)", "Total Teaching Load (Hrs)", "Assigned Subjects", "Administrative Duties", "Mentoring Details", "Project Guide Details"};
            createHeaderRow(sheetWorkload, workloadHeaders, headerStyle);
            int rowIdx8 = 1;
            for (FacultyProfileDto p : profiles) {
                Row row = sheetWorkload.createRow(rowIdx8);
                createCell(row, 0, String.valueOf(rowIdx8), dataStyle);
                createCell(row, 1, p.getEmployeeId(), dataStyle);
                createCell(row, 2, p.getFullName(), dataStyle);
                createCell(row, 3, p.getTheoryLoadHours() != null ? String.valueOf(p.getTheoryLoadHours()) : "0", dataStyle);
                createCell(row, 4, p.getLabLoadHours() != null ? String.valueOf(p.getLabLoadHours()) : "0", dataStyle);
                createCell(row, 5, p.getTotalTeachingLoadHours() != null ? String.valueOf(p.getTotalTeachingLoadHours()) : "0", dataStyle);

                String assignedSubjectsStr = "-";
                if (p.getAssignedSubjects() != null && !p.getAssignedSubjects().isEmpty()) {
                    assignedSubjectsStr = p.getAssignedSubjects().stream()
                            .map(s -> s.getSubjectName() != null ? s.getSubjectName() : "Subject")
                            .collect(Collectors.joining("; "));
                }
                createCell(row, 6, assignedSubjectsStr, dataStyle);
                createCell(row, 7, p.getAdminDuties(), dataStyle);
                createCell(row, 8, p.getMentoringDetails(), dataStyle);
                createCell(row, 9, p.getProjectGuideDetails(), dataStyle);
                rowIdx8++;
            }
            autoSizeColumns(sheetWorkload, workloadHeaders.length);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to export department faculty Excel report", e);
            throw new RuntimeException("Failed to generate department Excel report: " + e.getMessage(), e);
        }
    }

    private void createHeaderRow(XSSFSheet sheet, String[] headers, CellStyle headerStyle) {
        Row row = sheet.createRow(0);
        row.setHeightInPoints(24);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void createCell(Row row, int colIdx, String value, CellStyle style) {
        Cell cell = row.createCell(colIdx);
        cell.setCellValue(value != null && !value.trim().isEmpty() ? value.trim() : "-");
        cell.setCellStyle(style);
    }

    private void autoSizeColumns(XSSFSheet sheet, int numCols) {
        for (int i = 0; i < numCols; i++) {
            sheet.autoSizeColumn(i);
            int width = sheet.getColumnWidth(i);
            if (width < 3200) sheet.setColumnWidth(i, 3200);
            if (width > 16000) sheet.setColumnWidth(i, 16000);
        }
    }
}
