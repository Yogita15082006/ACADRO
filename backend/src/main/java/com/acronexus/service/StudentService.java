package com.acronexus.service;

import com.acronexus.dto.StudentRequestDto;
import com.acronexus.dto.StudentResponseDto;
import com.acronexus.entity.Gender;
import com.acronexus.entity.Student;
import com.acronexus.entity.StudentEnrollment;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.StudentRepository;
import com.acronexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import com.acronexus.entity.CoordinatorAssignment;
import com.acronexus.repository.CoordinatorAssignmentRepository;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final com.acronexus.repository.ExaminationEligibilityStudentRepository examinationEligibilityStudentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.acronexus.repository.AcroClassRepository acroClassRepository;
    private final com.acronexus.repository.AcademicYearRepository academicYearRepository;
    private final com.acronexus.repository.SemesterRepository semesterRepository;
    private final com.acronexus.repository.AcademicRecordRepository academicRecordRepository;
    private final com.acronexus.repository.ClassSubjectRepository classSubjectRepository;
    private final com.acronexus.repository.FamilyDetailsRepository familyDetailsRepository;
    private final com.acronexus.repository.AddressDetailsRepository addressDetailsRepository;
    private final com.acronexus.repository.StudentProjectRepository studentProjectRepository;
    private final com.acronexus.repository.StudentAchievementRepository studentAchievementRepository;
    private final com.acronexus.repository.StudentCertificationRepository studentCertificationRepository;
    private final com.acronexus.repository.StudentInternshipRepository studentInternshipRepository;

    private boolean strictMatchEnrollment(StudentEnrollment e, List<CoordinatorAssignment> assignments) {
        if (e == null || e.getAcroClass() == null || e.getStudent() == null) return false;
        
        for (CoordinatorAssignment a : assignments) {
            // If class is not explicitly assigned, we must verify department scope
            boolean hasSpecificClass = a.getClassName() != null && !a.getClassName().isBlank();
            
            if (!hasSpecificClass) {
                if (a.getCoordinator() != null && a.getCoordinator().getDepartment() != null 
                    && e.getAcroClass().getDepartment() != null) {
                    if (!a.getCoordinator().getDepartment().getId().equals(e.getAcroClass().getDepartment().getId())) {
                        continue;
                    }
                } else {
                    continue; // Cannot verify department scope, strictly reject
                }
            }

            boolean classMatch = true;
            String className = a.getClassName();
            if (className != null && !className.isBlank()) {
                String name = e.getAcroClass().getName() != null ? e.getAcroClass().getName() : "";
                String section = e.getAcroClass().getSection() != null ? e.getAcroClass().getSection() : "";
                classMatch = name.equalsIgnoreCase(className) || 
                             section.equalsIgnoreCase(className) || 
                             (name + "-" + section).equalsIgnoreCase(className) ||
                             (name + " " + section).equalsIgnoreCase(className);
            }
            if (!classMatch) continue;
            
            // Batch
            if (a.getBatch() != null) {
                if (e.getStudent().getBatchYear() == null || !a.getBatch().equalsIgnoreCase(e.getStudent().getBatchYear())) continue;
            }
            
            // Academic Year
            if (a.getAcademicYear() != null) {
                if (e.getAcademicYear() == null) continue;
                String assignedYear = a.getAcademicYear().toLowerCase().trim();
                String enrolledYear = e.getAcademicYear().getYear().toLowerCase().trim();
                if (!assignedYear.equals(enrolledYear) 
                    && !enrolledYear.startsWith(assignedYear) 
                    && !assignedYear.startsWith(enrolledYear)) {
                    continue;
                }
            }
            
            // Semester
            if (a.getSemester() != null) {
                if (e.getSemester() == null) continue;
                String semName = "Semester " + e.getSemester().getSemesterNumber();
                if (!a.getSemester().equalsIgnoreCase(semName)) continue;
            }
            
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Page<StudentResponseDto> getAllStudents(String search, String batch, String className, String status, Pageable pageable) {
        // Sanitize inputs (frontend sends empty strings instead of null)
        search = (search != null && search.trim().isEmpty()) ? null : search;
        batch = (batch != null && batch.trim().isEmpty()) ? null : batch;
        className = (className != null && className.trim().isEmpty()) ? null : className;
        status = (status != null && status.trim().isEmpty()) ? null : status;

        Pageable customPageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), 
                2000, 
                pageable.getSort());

        return studentRepository.findAllWithFilters(search, batch, status, className, customPageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<String> getBatches() {
        return studentRepository.findDistinctBatchYears();
    }

    @Transactional(readOnly = true)
    public List<String> getClasses() {
        return enrollmentRepository.findDistinctActiveAcroClasses().stream()
                .map(ac -> {
                    String sec = ac.getSection();
                    if (sec != null && !sec.trim().isEmpty()) {
                        return sec.trim();
                    }
                    return ac.getName() != null ? ac.getName().trim() : "";
                })
                .filter(name -> !name.isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.acronexus.dto.OptionDto> getAcademicYearOptions() {
        return academicYearRepository.findAll().stream()
                .map(y -> new com.acronexus.dto.OptionDto(y.getId(), y.getYear()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.acronexus.dto.OptionDto> getSemesterOptions(UUID academicYearId) {
        return semesterRepository.findAll().stream()
                .filter(s -> s.getAcademicYear() != null && s.getAcademicYear().getId().equals(academicYearId))
                .map(s -> new com.acronexus.dto.OptionDto(s.getId(), "Semester " + s.getSemesterNumber()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.acronexus.dto.OptionDto> getClassOptions(String batch, UUID academicYearId, UUID semesterId) {
        List<com.acronexus.entity.AcroClass> classes = new java.util.ArrayList<>();
        
        if (batch != null && !batch.isEmpty() && academicYearId != null && semesterId != null) {
            com.acronexus.entity.AcademicYear year = academicYearRepository.findById(academicYearId).orElse(null);
            com.acronexus.entity.Semester sem = semesterRepository.findById(semesterId).orElse(null);
            if (year != null && sem != null) {
                classes = enrollmentRepository.findClasses(batch, java.util.List.of(year.getYear()), String.valueOf(sem.getSemesterNumber()));
            }
        }

        java.util.Map<String, com.acronexus.dto.OptionDto> uniqueOptions = new java.util.LinkedHashMap<>();
        for (com.acronexus.entity.AcroClass c : classes) {
            if (c.getIsActive() != null && c.getIsActive() && c.getIsDeleted() != null && !c.getIsDeleted()) {
                String label = (c.getSection() != null && !c.getSection().trim().isEmpty()) ? c.getSection().trim() : c.getName();
                if (label != null && !uniqueOptions.containsKey(label)) {
                    uniqueOptions.put(label, new com.acronexus.dto.OptionDto(c.getId(), label));
                }
            }
        }
        return new java.util.ArrayList<>(uniqueOptions.values());
    }

    @Transactional(readOnly = true)
    public byte[] exportStudentsToExcel(String search, String batch, String className, String status) {
        Pageable customPageable = org.springframework.data.domain.PageRequest.of(0, 100000);
        List<Student> students = studentRepository.findAllWithFilters(search, batch, status, className, customPageable).getContent();

        List<UUID> userIds = students.stream().map(s -> s.getUser().getId()).collect(Collectors.toList());
        List<UUID> studentIds = students.stream().map(s -> s.getId()).collect(Collectors.toList());
        java.util.Map<UUID, com.acronexus.entity.FamilyDetails> familyMap = new java.util.HashMap<>();
        java.util.Map<UUID, com.acronexus.entity.AddressDetails> addressMap = new java.util.HashMap<>();
        java.util.Map<UUID, List<com.acronexus.entity.AcademicRecord>> recordMap = new java.util.HashMap<>();
        java.util.Map<UUID, List<com.acronexus.entity.StudentProject>> projectMap = new java.util.HashMap<>();
        java.util.Map<UUID, List<com.acronexus.entity.StudentAchievement>> achievementMap = new java.util.HashMap<>();
        java.util.Map<UUID, List<com.acronexus.entity.StudentCertification>> certMap = new java.util.HashMap<>();
        java.util.Map<UUID, List<com.acronexus.entity.StudentInternship>> internMap = new java.util.HashMap<>();

        if (!userIds.isEmpty()) {
            familyDetailsRepository.findAllById(userIds).forEach(f -> familyMap.put(f.getId(), f));
            addressDetailsRepository.findAllById(userIds).forEach(a -> addressMap.put(a.getId(), a));
        }
        if (!studentIds.isEmpty()) {
            academicRecordRepository.findByStudentIdIn(studentIds).forEach(r -> {
                recordMap.computeIfAbsent(r.getStudent().getId(), k -> new java.util.ArrayList<>()).add(r);
            });
            studentProjectRepository.findByStudentIdIn(studentIds).forEach(r -> {
                projectMap.computeIfAbsent(r.getStudent().getId(), k -> new java.util.ArrayList<>()).add(r);
            });
            studentAchievementRepository.findByStudentIdIn(studentIds).forEach(r -> {
                achievementMap.computeIfAbsent(r.getStudent().getId(), k -> new java.util.ArrayList<>()).add(r);
            });
            studentCertificationRepository.findByStudentIdIn(studentIds).forEach(r -> {
                certMap.computeIfAbsent(r.getStudent().getId(), k -> new java.util.ArrayList<>()).add(r);
            });
            studentInternshipRepository.findByStudentIdIn(studentIds).forEach(r -> {
                internMap.computeIfAbsent(r.getStudent().getId(), k -> new java.util.ArrayList<>()).add(r);
            });
        }

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            
            org.apache.poi.xssf.usermodel.XSSFSheet sheet = workbook.createSheet("Students");
            sheet.createFreezePane(0, 1);
            
            org.apache.poi.xssf.usermodel.XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            
            org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setWrapText(true);
            headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
            
            String[] columns = {
                "Enrollment Number", "Roll No", "Institute Enrollment", "First Name", "Last Name", "Gender", "DOB", 
                "College Email", "Personal Email", "Phone", "WhatsApp Number", 
                "Blood Group", "Category", "Nationality", "Religion", "Residence Type", "Aadhaar Number", 
                "Batch", "Admission Year", "Academic Year", "Semester", "Class", "Section", "Department", "Degree", "Status",
                "Technical Skills", "Soft Skills", "Hobbies", "Clubs", "Domains", "Job Preferences", "Relocation",
                "LinkedIn", "GitHub", "Portfolio", "LeetCode", "HackerRank", "Resume URL",
                "Active Backlogs", "History Backlogs", "Study Gap",
                "Local Address", "Local City", "Local State", "Local Pincode",
                "Permanent Address", "Permanent City", "Permanent State", "Permanent Pincode",
                "Father Name", "Father Mobile", "Father Occupation", "Father Designation", "Father Organization",
                "Mother Name", "Mother Mobile", "Mother Occupation", "Mother Designation", "Mother Organization",
                "Family Status", "Brothers", "Sisters", "Annual Income",
                "10th School", "10th Board", "10th Passing Year", "10th %",
                "12th School", "12th Board", "12th Passing Year", "12th %",
                "Diploma School", "Diploma Board", "Diploma Passing Year", "Diploma %",
                "SGPA Sem 1", "SGPA Sem 2", "SGPA Sem 3", "SGPA Sem 4", "SGPA Sem 5", "SGPA Sem 6", "SGPA Sem 7", "SGPA Sem 8", "CGPA",
                "Marksheet Sem 1", "Marksheet Sem 2", "Marksheet Sem 3", "Marksheet Sem 4",
                "Marksheet Sem 5", "Marksheet Sem 6", "Marksheet Sem 7", "Marksheet Sem 8", "Resume URL"
            };
            
            org.apache.poi.xssf.usermodel.XSSFRow headerRow = sheet.createRow(0);
            headerRow.setHeight((short) 600);
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.xssf.usermodel.XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Student s : students) {
                com.acronexus.entity.User u = s.getUser();
                org.apache.poi.xssf.usermodel.XSSFRow row = sheet.createRow(rowIdx++);
                int col = 0;
                
                row.createCell(col++).setCellValue(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "");
                row.createCell(col++).setCellValue(s.getRollNo() != null ? s.getRollNo() : "");
                row.createCell(col++).setCellValue(s.getInstituteEnrollment() != null ? s.getInstituteEnrollment() : "");
                row.createCell(col++).setCellValue(u != null && u.getFirstName() != null ? u.getFirstName() : "");
                row.createCell(col++).setCellValue(u != null && u.getLastName() != null ? u.getLastName() : "");
                row.createCell(col++).setCellValue(u != null && u.getGender() != null ? u.getGender().name() : "");
                row.createCell(col++).setCellValue(u != null && u.getDob() != null ? u.getDob().toString() : "");
                
                row.createCell(col++).setCellValue(u != null && u.getCollegeEmail() != null ? u.getCollegeEmail() : (u != null && u.getEmail() != null ? u.getEmail() : ""));
                row.createCell(col++).setCellValue(u != null && u.getPersonalEmail() != null ? u.getPersonalEmail() : "");
                row.createCell(col++).setCellValue(u != null && u.getPhone() != null ? u.getPhone() : "");
                row.createCell(col++).setCellValue(u != null && u.getWhatsappNumber() != null ? u.getWhatsappNumber() : "");
                
                row.createCell(col++).setCellValue(u != null && u.getBloodGroup() != null ? u.getBloodGroup().name() : "");
                row.createCell(col++).setCellValue(u != null && u.getCategory() != null ? u.getCategory() : "");
                row.createCell(col++).setCellValue(u != null && u.getNationality() != null ? u.getNationality() : "");
                row.createCell(col++).setCellValue(u != null && u.getReligion() != null ? u.getReligion() : "");
                row.createCell(col++).setCellValue(u != null && u.getResidenceType() != null ? u.getResidenceType() : "");
                row.createCell(col++).setCellValue(u != null && u.getAadhaarNumber() != null ? u.getAadhaarNumber() : "");
                
                String academicYear = "";
                String sem = "";
                String sClassName = "";
                String section = "";
                String dept = "";
                String degree = "";
                
                com.acronexus.entity.StudentEnrollment activeEnrollment = enrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(s.getId()).orElse(null);
                if (activeEnrollment != null) {
                    if (activeEnrollment.getAcademicYear() != null) academicYear = activeEnrollment.getAcademicYear().getYear();
                    if (activeEnrollment.getSemester() != null) sem = String.valueOf(activeEnrollment.getSemester().getSemesterNumber());
                    if (activeEnrollment.getAcroClass() != null) {
                        sClassName = activeEnrollment.getAcroClass().getName() != null ? activeEnrollment.getAcroClass().getName() : "";
                        section = activeEnrollment.getAcroClass().getSection() != null ? activeEnrollment.getAcroClass().getSection() : "";
                        if (activeEnrollment.getAcroClass().getDepartment() != null) dept = activeEnrollment.getAcroClass().getDepartment().getName();
                        if (activeEnrollment.getAcroClass().getDegreeProgram() != null) degree = activeEnrollment.getAcroClass().getDegreeProgram().getName();
                    }
                } else {
                    sem = s.getCurrentSemester() != null ? String.valueOf(s.getCurrentSemester()) : "";
                    sClassName = s.getCourse() != null ? s.getCourse() : "";
                    section = s.getSection() != null ? s.getSection() : "";
                    dept = u != null && u.getDepartment() != null ? u.getDepartment().getName() : "";
                    degree = s.getDegreeProgram() != null ? s.getDegreeProgram().getName() : "";
                    academicYear = s.getBatchYear() != null ? s.getBatchYear() : "";
                }
                
                row.createCell(col++).setCellValue(s.getBatchYear() != null ? s.getBatchYear() : "");
                row.createCell(col++).setCellValue(s.getAdmissionYear() != null ? s.getAdmissionYear() : "");
                row.createCell(col++).setCellValue(academicYear != null ? academicYear : "");
                row.createCell(col++).setCellValue(sem != null ? sem : "");
                row.createCell(col++).setCellValue(sClassName != null ? sClassName : "");
                row.createCell(col++).setCellValue(section != null ? section : "");
                row.createCell(col++).setCellValue(dept != null ? dept : "");
                row.createCell(col++).setCellValue(degree != null ? degree : "");
                row.createCell(col++).setCellValue(u != null && u.getIsActive() != null ? (u.getIsActive() ? "Active" : "Inactive") : "Inactive");
                
                row.createCell(col++).setCellValue(s.getTechnicalSkills() != null ? s.getTechnicalSkills() : "");
                row.createCell(col++).setCellValue(s.getSoftSkills() != null ? s.getSoftSkills() : "");
                row.createCell(col++).setCellValue(s.getHobbies() != null ? s.getHobbies() : "");
                row.createCell(col++).setCellValue(s.getClubs() != null ? s.getClubs() : "");
                row.createCell(col++).setCellValue(s.getDomains() != null ? s.getDomains() : "");
                row.createCell(col++).setCellValue(s.getJobPreferences() != null ? s.getJobPreferences() : "");
                row.createCell(col++).setCellValue(s.getRelocation() != null ? s.getRelocation() : "");
                
                row.createCell(col++).setCellValue(s.getLinkedin() != null ? s.getLinkedin() : "");
                row.createCell(col++).setCellValue(s.getGithub() != null ? s.getGithub() : "");
                row.createCell(col++).setCellValue(s.getPortfolio() != null ? s.getPortfolio() : "");
                row.createCell(col++).setCellValue(s.getLeetcode() != null ? s.getLeetcode() : "");
                row.createCell(col++).setCellValue(s.getHackerrank() != null ? s.getHackerrank() : "");
                row.createCell(col++).setCellValue(s.getResumeUrl() != null ? s.getResumeUrl() : "");
                
                row.createCell(col++).setCellValue(s.getActiveBacklogs() != null ? s.getActiveBacklogs().toString() : "");
                row.createCell(col++).setCellValue(s.getHistoryBacklogs() != null ? s.getHistoryBacklogs().toString() : "");
                row.createCell(col++).setCellValue(s.getStudyGap() != null ? s.getStudyGap().toString() : "");
                
                com.acronexus.entity.AddressDetails address = u != null ? addressMap.get(u.getId()) : null;
                row.createCell(col++).setCellValue(address != null && address.getLocalAddress() != null ? address.getLocalAddress() : "");
                row.createCell(col++).setCellValue(address != null && address.getLocalCity() != null ? address.getLocalCity() : "");
                row.createCell(col++).setCellValue(address != null && address.getLocalState() != null ? address.getLocalState() : "");
                row.createCell(col++).setCellValue(address != null && address.getLocalPincode() != null ? address.getLocalPincode() : "");
                row.createCell(col++).setCellValue(address != null && address.getPermanentAddress() != null ? address.getPermanentAddress() : "");
                row.createCell(col++).setCellValue(address != null && address.getPermanentCity() != null ? address.getPermanentCity() : "");
                row.createCell(col++).setCellValue(address != null && address.getPermanentState() != null ? address.getPermanentState() : "");
                row.createCell(col++).setCellValue(address != null && address.getPermanentPincode() != null ? address.getPermanentPincode() : "");
                
                com.acronexus.entity.FamilyDetails family = u != null ? familyMap.get(u.getId()) : null;
                row.createCell(col++).setCellValue(family != null && family.getFatherName() != null ? family.getFatherName() : "");
                row.createCell(col++).setCellValue(family != null && family.getFatherMobile() != null ? family.getFatherMobile() : "");
                row.createCell(col++).setCellValue(family != null && family.getFatherOccupation() != null ? family.getFatherOccupation() : "");
                row.createCell(col++).setCellValue(family != null && family.getFatherDesignation() != null ? family.getFatherDesignation() : "");
                row.createCell(col++).setCellValue(family != null && family.getFatherOrganization() != null ? family.getFatherOrganization() : "");
                
                row.createCell(col++).setCellValue(family != null && family.getMotherName() != null ? family.getMotherName() : "");
                row.createCell(col++).setCellValue(family != null && family.getMotherMobile() != null ? family.getMotherMobile() : "");
                row.createCell(col++).setCellValue(family != null && family.getMotherOccupation() != null ? family.getMotherOccupation() : "");
                row.createCell(col++).setCellValue(family != null && family.getMotherDesignation() != null ? family.getMotherDesignation() : "");
                row.createCell(col++).setCellValue(family != null && family.getMotherOrganization() != null ? family.getMotherOrganization() : "");
                
                row.createCell(col++).setCellValue(family != null && family.getFamilyStatus() != null ? family.getFamilyStatus() : "");
                row.createCell(col++).setCellValue(family != null && family.getNumberOfBrothers() != null ? family.getNumberOfBrothers().toString() : "");
                row.createCell(col++).setCellValue(family != null && family.getNumberOfSisters() != null ? family.getNumberOfSisters().toString() : "");
                row.createCell(col++).setCellValue(family != null && family.getAnnualIncome() != null ? family.getAnnualIncome() : "");
                
                List<com.acronexus.entity.AcademicRecord> recs = recordMap.getOrDefault(s.getId(), java.util.Collections.emptyList());
                com.acronexus.entity.AcademicRecord r10 = recs.stream().filter(r -> "10th".equalsIgnoreCase(r.getEducationLevel())).findFirst().orElse(null);
                com.acronexus.entity.AcademicRecord r12 = recs.stream().filter(r -> "12th".equalsIgnoreCase(r.getEducationLevel())).findFirst().orElse(null);
                com.acronexus.entity.AcademicRecord rDip = recs.stream().filter(r -> "Diploma".equalsIgnoreCase(r.getEducationLevel())).findFirst().orElse(null);
                
                row.createCell(col++).setCellValue(r10 != null && r10.getInstitutionName() != null ? r10.getInstitutionName() : "");
                row.createCell(col++).setCellValue(r10 != null && r10.getBoardName() != null ? r10.getBoardName() : "");
                row.createCell(col++).setCellValue(r10 != null && r10.getPassingYear() != null ? r10.getPassingYear().toString() : "");
                row.createCell(col++).setCellValue(r10 != null && r10.getPercentage() != null ? r10.getPercentage().toString() : "");
                
                row.createCell(col++).setCellValue(r12 != null && r12.getInstitutionName() != null ? r12.getInstitutionName() : "");
                row.createCell(col++).setCellValue(r12 != null && r12.getBoardName() != null ? r12.getBoardName() : "");
                row.createCell(col++).setCellValue(r12 != null && r12.getPassingYear() != null ? r12.getPassingYear().toString() : "");
                row.createCell(col++).setCellValue(r12 != null && r12.getPercentage() != null ? r12.getPercentage().toString() : "");
                
                row.createCell(col++).setCellValue(rDip != null && rDip.getInstitutionName() != null ? rDip.getInstitutionName() : "");
                row.createCell(col++).setCellValue(rDip != null && rDip.getBoardName() != null ? rDip.getBoardName() : "");
                row.createCell(col++).setCellValue(rDip != null && rDip.getPassingYear() != null ? rDip.getPassingYear().toString() : "");
                row.createCell(col++).setCellValue(rDip != null && rDip.getPercentage() != null ? rDip.getPercentage().toString() : "");
                
                row.createCell(col++).setCellValue(s.getSgpaSem1() != null ? s.getSgpaSem1().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem2() != null ? s.getSgpaSem2().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem3() != null ? s.getSgpaSem3().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem4() != null ? s.getSgpaSem4().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem5() != null ? s.getSgpaSem5().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem6() != null ? s.getSgpaSem6().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem7() != null ? s.getSgpaSem7().toString() : "");
                row.createCell(col++).setCellValue(s.getSgpaSem8() != null ? s.getSgpaSem8().toString() : "");
                row.createCell(col++).setCellValue(s.getCgpa() != null ? s.getCgpa().toString() : "");
                
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem1() != null ? s.getMarksheetUrlSem1() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem2() != null ? s.getMarksheetUrlSem2() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem3() != null ? s.getMarksheetUrlSem3() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem4() != null ? s.getMarksheetUrlSem4() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem5() != null ? s.getMarksheetUrlSem5() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem6() != null ? s.getMarksheetUrlSem6() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem7() != null ? s.getMarksheetUrlSem7() : "");
                row.createCell(col++).setCellValue(s.getMarksheetUrlSem8() != null ? s.getMarksheetUrlSem8() : "");
                row.createCell(col++).setCellValue(s.getResumeUrl() != null ? s.getResumeUrl() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                if (currentWidth < 4000) sheet.setColumnWidth(i, 4000);
                else if (currentWidth > 15000) sheet.setColumnWidth(i, 15000);
            }
            
            // --- PROJECTS SHEET ---
            org.apache.poi.xssf.usermodel.XSSFSheet projSheet = workbook.createSheet("Projects");
            projSheet.createFreezePane(0, 1);
            String[] pCols = {"Enrollment Number", "Student Name", "Project Title", "Description", "Tech Stack", "GitHub", "Live Link"};
            org.apache.poi.xssf.usermodel.XSSFRow pHeader = projSheet.createRow(0);
            for (int i = 0; i < pCols.length; i++) {
                org.apache.poi.xssf.usermodel.XSSFCell c = pHeader.createCell(i);
                c.setCellValue(pCols[i]);
                c.setCellStyle(headerStyle);
            }
            int pRowIdx = 1;
            for (Student s : students) {
                List<com.acronexus.entity.StudentProject> projs = projectMap.getOrDefault(s.getId(), java.util.Collections.emptyList());
                for (com.acronexus.entity.StudentProject p : projs) {
                    org.apache.poi.xssf.usermodel.XSSFRow r = projSheet.createRow(pRowIdx++);
                    int c = 0;
                    r.createCell(c++).setCellValue(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "");
                    r.createCell(c++).setCellValue((s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "") + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""));
                    r.createCell(c++).setCellValue(p.getTitle() != null ? p.getTitle() : "");
                    r.createCell(c++).setCellValue(p.getDescription() != null ? p.getDescription() : "");
                    r.createCell(c++).setCellValue(p.getTechStack() != null ? String.join(", ", p.getTechStack()) : "");
                    r.createCell(c++).setCellValue(p.getGithubLink() != null ? p.getGithubLink() : "");
                    r.createCell(c++).setCellValue(p.getLiveLink() != null ? p.getLiveLink() : "");
                }
            }
            for (int i = 0; i < pCols.length; i++) projSheet.autoSizeColumn(i);
            
            // --- ACHIEVEMENTS SHEET ---
            org.apache.poi.xssf.usermodel.XSSFSheet aSheet = workbook.createSheet("Achievements");
            aSheet.createFreezePane(0, 1);
            String[] aCols = {"Enrollment Number", "Student Name", "Title", "Category", "Date", "Description", "Link"};
            org.apache.poi.xssf.usermodel.XSSFRow aHeader = aSheet.createRow(0);
            for (int i = 0; i < aCols.length; i++) {
                org.apache.poi.xssf.usermodel.XSSFCell c = aHeader.createCell(i);
                c.setCellValue(aCols[i]);
                c.setCellStyle(headerStyle);
            }
            int aRowIdx = 1;
            for (Student s : students) {
                List<com.acronexus.entity.StudentAchievement> achs = achievementMap.getOrDefault(s.getId(), java.util.Collections.emptyList());
                for (com.acronexus.entity.StudentAchievement a : achs) {
                    org.apache.poi.xssf.usermodel.XSSFRow r = aSheet.createRow(aRowIdx++);
                    int c = 0;
                    r.createCell(c++).setCellValue(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "");
                    r.createCell(c++).setCellValue((s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "") + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""));
                    r.createCell(c++).setCellValue(a.getTitle() != null ? a.getTitle() : "");
                    r.createCell(c++).setCellValue(a.getCategory() != null ? a.getCategory() : "");
                    r.createCell(c++).setCellValue(a.getDate() != null ? a.getDate().toString() : "");
                    r.createCell(c++).setCellValue(a.getDescription() != null ? a.getDescription() : "");
                    r.createCell(c++).setCellValue(a.getLink() != null ? a.getLink() : "");
                }
            }
            for (int i = 0; i < aCols.length; i++) aSheet.autoSizeColumn(i);

            // --- CERTIFICATIONS SHEET ---
            org.apache.poi.xssf.usermodel.XSSFSheet cSheet = workbook.createSheet("Certifications");
            cSheet.createFreezePane(0, 1);
            String[] cCols = {"Enrollment Number", "Student Name", "Title", "Issuer", "Date", "Link"};
            org.apache.poi.xssf.usermodel.XSSFRow cHeader = cSheet.createRow(0);
            for (int i = 0; i < cCols.length; i++) {
                org.apache.poi.xssf.usermodel.XSSFCell c = cHeader.createCell(i);
                c.setCellValue(cCols[i]);
                c.setCellStyle(headerStyle);
            }
            int cRowIdx = 1;
            for (Student s : students) {
                List<com.acronexus.entity.StudentCertification> certs = certMap.getOrDefault(s.getId(), java.util.Collections.emptyList());
                for (com.acronexus.entity.StudentCertification c_ent : certs) {
                    org.apache.poi.xssf.usermodel.XSSFRow r = cSheet.createRow(cRowIdx++);
                    int c = 0;
                    r.createCell(c++).setCellValue(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "");
                    r.createCell(c++).setCellValue((s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "") + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""));
                    r.createCell(c++).setCellValue(c_ent.getTitle() != null ? c_ent.getTitle() : "");
                    r.createCell(c++).setCellValue(c_ent.getIssuer() != null ? c_ent.getIssuer() : "");
                    r.createCell(c++).setCellValue(c_ent.getDate() != null ? c_ent.getDate().toString() : "");
                    r.createCell(c++).setCellValue(c_ent.getLink() != null ? c_ent.getLink() : "");
                }
            }
            for (int i = 0; i < cCols.length; i++) cSheet.autoSizeColumn(i);
            
            // --- INTERNSHIPS SHEET ---
            org.apache.poi.xssf.usermodel.XSSFSheet iSheet = workbook.createSheet("Internships");
            iSheet.createFreezePane(0, 1);
            String[] iCols = {"Enrollment Number", "Student Name", "Role", "Company", "Mentor", "Duration", "Technologies"};
            org.apache.poi.xssf.usermodel.XSSFRow iHeader = iSheet.createRow(0);
            for (int i = 0; i < iCols.length; i++) {
                org.apache.poi.xssf.usermodel.XSSFCell c = iHeader.createCell(i);
                c.setCellValue(iCols[i]);
                c.setCellStyle(headerStyle);
            }
            int iRowIdx = 1;
            for (Student s : students) {
                List<com.acronexus.entity.StudentInternship> ints = internMap.getOrDefault(s.getId(), java.util.Collections.emptyList());
                for (com.acronexus.entity.StudentInternship i_ent : ints) {
                    org.apache.poi.xssf.usermodel.XSSFRow r = iSheet.createRow(iRowIdx++);
                    int c = 0;
                    r.createCell(c++).setCellValue(s.getEnrollmentNo() != null ? s.getEnrollmentNo() : "");
                    r.createCell(c++).setCellValue((s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "") + " " + (s.getUser().getLastName() != null ? s.getUser().getLastName() : ""));
                    r.createCell(c++).setCellValue(i_ent.getRole() != null ? i_ent.getRole() : "");
                    r.createCell(c++).setCellValue(i_ent.getCompany() != null ? i_ent.getCompany() : "");
                    r.createCell(c++).setCellValue(i_ent.getMentor() != null ? i_ent.getMentor() : "");
                    r.createCell(c++).setCellValue(i_ent.getDuration() != null ? i_ent.getDuration() : "");
                    r.createCell(c++).setCellValue(i_ent.getTechnologies() != null ? String.join(", ", i_ent.getTechnologies()) : "");
                }
            }
            for (int i = 0; i < iCols.length; i++) iSheet.autoSizeColumn(i);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to export to Excel: " + e.getMessage());
        }
    }

    @Transactional
    public StudentResponseDto createStudent(StudentRequestDto request) {
        User user = new User();
        String[] nameParts = request.getName().split(" ", 2);
        user.setFirstName(nameParts[0]);
        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        user.setEmail(request.getName().toLowerCase().replace(" ", ".") + "@acropolis.in");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(UserRole.STUDENT);
        user.setIsActive(true);
        try {
            user.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        } catch (Exception e) {
            user.setGender(Gender.OTHER);
        }
        User savedUser = userRepository.save(user);

        Student student = new Student();
        student.setUser(savedUser);
        student.setEnrollmentNo(request.getEnrollmentNumber());
        student.setBatchYear(request.getBatch());
        Student savedStudent = studentRepository.save(student);

        if (request.getClassId() != null || request.getAcademicYearId() != null || request.getSemesterId() != null) {
            StudentEnrollment enrollment = new StudentEnrollment();
            enrollment.setStudent(savedStudent);
            enrollment.setIsActive(true);
            if (request.getClassId() != null) {
                acroClassRepository.findById(request.getClassId()).ifPresent(enrollment::setAcroClass);
            }
            if (request.getAcademicYearId() != null) {
                academicYearRepository.findById(request.getAcademicYearId()).ifPresent(enrollment::setAcademicYear);
            }
            if (request.getSemesterId() != null) {
                semesterRepository.findById(request.getSemesterId()).ifPresent(enrollment::setSemester);
            }
            enrollmentRepository.save(enrollment);
        }

        return mapToDto(savedStudent);
    }

    @Transactional
    public StudentResponseDto updateStudent(UUID id, StudentRequestDto request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        student.setEnrollmentNo(request.getEnrollmentNumber());
        student.setBatchYear(request.getBatch());
        
        User user = student.getUser();
        String[] nameParts = request.getName().split(" ", 2);
        user.setFirstName(nameParts[0]);
        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        try {
            user.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        } catch (Exception e) {
            user.setGender(Gender.OTHER);
        }
        if (request.getStatus() != null) {
            user.setIsActive("Active".equalsIgnoreCase(request.getStatus()));
        }
        userRepository.save(user);
        
        Student savedStudent = studentRepository.save(student);

        if (request.getClassId() != null || request.getAcademicYearId() != null || request.getSemesterId() != null) {
            java.util.Optional<StudentEnrollment> activeEnrollmentOpt = enrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(id);
            StudentEnrollment enrollment = activeEnrollmentOpt.orElseGet(() -> {
                StudentEnrollment newEnrollment = new StudentEnrollment();
                newEnrollment.setStudent(savedStudent);
                newEnrollment.setIsActive(true);
                return newEnrollment;
            });

            if (request.getClassId() != null) {
                acroClassRepository.findById(request.getClassId()).ifPresent(enrollment::setAcroClass);
            }
            if (request.getAcademicYearId() != null) {
                academicYearRepository.findById(request.getAcademicYearId()).ifPresent(enrollment::setAcademicYear);
            }
            if (request.getSemesterId() != null) {
                semesterRepository.findById(request.getSemesterId()).ifPresent(enrollment::setSemester);
            }
            enrollmentRepository.save(enrollment);
        }

        return mapToDto(savedStudent);
    }

    @Transactional
    public void deleteStudent(UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        
        // Native queries to ensure all foreign keys are cleared before deleting student
        jdbcTemplate.update("DELETE FROM examination_eligibility_students WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM exam_results WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM student_attendance WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM student_attendance_history WHERE attendance_id IN (SELECT id FROM student_attendance WHERE student_id = ?)", id);
        jdbcTemplate.update("DELETE FROM student_achievements WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM student_certifications WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM student_internships WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM student_projects WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM assignment_submissions WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM quiz_attempts WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM event_attendance_records WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM event_registrations WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM exam_ai_feedback WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM seating_arrangement_students WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM resource_downloads WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM academic_records WHERE student_id = ?", id);
        jdbcTemplate.update("DELETE FROM student_enrollments WHERE student_id = ?", id);
        
        // Delete User-specific child records since we will delete the User account
        jdbcTemplate.update("DELETE FROM user_notifications WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM address_details WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM family_details WHERE user_id = ?", id);
        
        // Nullify uploadedBy/createdBy where the student might have created records
        jdbcTemplate.update("UPDATE file_storage SET uploaded_by = NULL WHERE uploaded_by = ?", id);
        
        studentRepository.delete(student);
        userRepository.delete(student.getUser());
    }

    @Transactional
    public void deleteAllStudents() {
        // Native queries for bulk wipe of all student-specific data
        jdbcTemplate.update("DELETE FROM examination_eligibility_students");
        jdbcTemplate.update("DELETE FROM exam_results");
        jdbcTemplate.update("DELETE FROM student_attendance_history WHERE attendance_id IN (SELECT id FROM student_attendance)");
        jdbcTemplate.update("DELETE FROM student_attendance");
        jdbcTemplate.update("DELETE FROM student_achievements");
        jdbcTemplate.update("DELETE FROM student_certifications");
        jdbcTemplate.update("DELETE FROM student_internships");
        jdbcTemplate.update("DELETE FROM student_projects");
        jdbcTemplate.update("DELETE FROM assignment_submissions");
        jdbcTemplate.update("DELETE FROM quiz_attempts");
        jdbcTemplate.update("DELETE FROM event_attendance_records");
        jdbcTemplate.update("DELETE FROM event_registrations");
        jdbcTemplate.update("DELETE FROM exam_ai_feedback");
        jdbcTemplate.update("DELETE FROM seating_arrangement_students");
        jdbcTemplate.update("DELETE FROM resource_downloads");
        jdbcTemplate.update("DELETE FROM academic_records");
        jdbcTemplate.update("DELETE FROM student_enrollments");
        
        // Delete User-specific child records for all students
        jdbcTemplate.update("DELETE FROM user_notifications WHERE user_id IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("DELETE FROM address_details WHERE user_id IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("DELETE FROM family_details WHERE user_id IN (SELECT id FROM users WHERE role = 'STUDENT')");
        
        // Nullify uploadedBy/createdBy where the students might have created records
        jdbcTemplate.update("UPDATE file_storage SET uploaded_by = NULL WHERE uploaded_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE bulk_uploads SET uploaded_by = NULL WHERE uploaded_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE examinations SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE examination_timetables SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE class_subjects SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE faculty_class_assignments SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE quizzes SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE assignments SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE events SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE notices SET published_by = NULL WHERE published_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE lecture_materials SET uploaded_by = NULL WHERE uploaded_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE timetables SET uploaded_by = NULL WHERE uploaded_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE ai_match_runs SET triggered_by = NULL WHERE triggered_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE faculty_activities SET marked_by = NULL WHERE marked_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE coordinator_assignments SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role = 'STUDENT')");
        jdbcTemplate.update("UPDATE coordinator_assignments SET coordinator_id = NULL WHERE coordinator_id IN (SELECT id FROM users WHERE role = 'STUDENT')");
        
        jdbcTemplate.update("DELETE FROM students"); // Delete all students first
        
        // Delete all student users
        jdbcTemplate.update("DELETE FROM users WHERE role = 'STUDENT'");
    }

    private StudentResponseDto mapToDto(Student student) {
        StudentResponseDto dto = new StudentResponseDto();
        dto.setId(student.getId());
        dto.setEnrollmentNumber(student.getEnrollmentNo());
        
        User user = student.getUser();
        if (user != null) {
            dto.setUserId(user.getId());
            dto.setName(user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : ""));
            dto.setGender(user.getGender() != null ? user.getGender().name() : "OTHER");
            dto.setAvatar(user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "https://ui-avatars.com/api/?name=" + dto.getName() + "&background=4F46E5&color=fff");
            dto.setStatus(user.getIsActive() != null && user.getIsActive() ? "Active" : "Inactive");
            dto.setEmail(user.getEmail());
            dto.setPhone(user.getPhone());
            
            if (user.getDepartment() != null) {
                String deptName = user.getDepartment().getName();
                dto.setDepartment(deptName);
                dto.setDepartmentName(deptName);
                dto.setBranch(deptName);
            }
            dto.setPersonalEmail(user.getPersonalEmail() != null ? user.getPersonalEmail() : "");
            dto.setCollegeEmail(user.getCollegeEmail() != null ? user.getCollegeEmail() : (user.getEmail() != null ? user.getEmail() : ""));
            dto.setWhatsappNumber(user.getWhatsappNumber() != null ? user.getWhatsappNumber() : "");
            dto.setDob(user.getDob() != null ? user.getDob().toString() : "");
            dto.setCategory(user.getCategory() != null ? user.getCategory() : "");
            dto.setReligion(user.getReligion() != null ? user.getReligion() : "");
            dto.setNationality(user.getNationality() != null ? user.getNationality() : "");
            dto.setResidenceType(user.getResidenceType() != null ? user.getResidenceType() : "");
            dto.setBloodGroup(user.getBloodGroup() != null ? user.getBloodGroup().name() : "");
        }
        
        dto.setBatch(student.getBatchYear() != null ? student.getBatchYear() : "");
        dto.setBatchYear(student.getBatchYear() != null ? student.getBatchYear() : "");
        dto.setRollNo(student.getRollNo() != null ? student.getRollNo() : "");
        dto.setAdmissionYear(student.getAdmissionYear() != null ? student.getAdmissionYear() : (student.getBatchYear() != null ? student.getBatchYear() : ""));
        dto.setInstituteEnrollment(student.getInstituteEnrollment() != null ? student.getInstituteEnrollment() : (student.getRollNo() != null ? student.getRollNo() : ""));
        dto.setHobbies(student.getHobbies() != null ? student.getHobbies() : "");
        dto.setClubs(student.getClubs() != null ? student.getClubs() : "");
        dto.setCourse(student.getCourse() != null ? student.getCourse() : "");
        dto.setSection(student.getSection() != null ? student.getSection() : "");
        dto.setSemester(student.getCurrentSemester() != null ? student.getCurrentSemester() : "");
        dto.setCurrentSemester(student.getCurrentSemester() != null ? student.getCurrentSemester() : "");

        // Get latest active enrollment for class info
        enrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(student.getId())
            .ifPresent(enrollment -> {
                if (enrollment.getAcroClass() != null) {
                    String name = enrollment.getAcroClass().getName();
                    String sec = enrollment.getAcroClass().getSection();
                    if ((dto.getCourse() == null || dto.getCourse().isEmpty()) && name != null) dto.setCourse(name);
                    if ((dto.getSection() == null || dto.getSection().isEmpty()) && sec != null) dto.setSection(sec);

                    if (sec != null && !sec.trim().isEmpty()) {
                        dto.setClassName(sec.trim());
                    } else {
                        dto.setClassName(name);
                    }
                    if ((dto.getDepartment() == null || dto.getDepartment().isEmpty()) && enrollment.getAcroClass().getDepartment() != null) {
                        String deptName = enrollment.getAcroClass().getDepartment().getName();
                        dto.setDepartment(deptName);
                        dto.setDepartmentName(deptName);
                        dto.setBranch(deptName);
                    }
                }
                if (enrollment.getAcademicYear() != null) {
                    dto.setYear(enrollment.getAcademicYear().getYear());
                }
                if (enrollment.getSemester() != null) {
                    String semStr = String.valueOf(enrollment.getSemester().getSemesterNumber());
                    dto.setSemester(semStr);
                    dto.setCurrentSemester(semStr);
                }
                if (enrollment.getAcroClass() != null) {
                    dto.setClassId(enrollment.getAcroClass().getId());
                }
                if (enrollment.getAcademicYear() != null) {
                    dto.setAcademicYearId(enrollment.getAcademicYear().getId());
                }
                if (enrollment.getSemester() != null) {
                    dto.setSemesterId(enrollment.getSemester().getId());
                }
            });

        if (dto.getClassName() == null && student.getCourse() != null) {
            String course = student.getCourse();
            String sec = student.getSection();
            if (sec != null && !sec.trim().isEmpty()) {
                dto.setClassName(sec.trim());
            } else {
                dto.setClassName(course);
            }
        }

        if (dto.getClassName() == null) dto.setClassName("Unassigned");

        dto.setSgpaSem1(student.getSgpaSem1());
        dto.setSgpaSem2(student.getSgpaSem2());
        dto.setSgpaSem3(student.getSgpaSem3());
        dto.setSgpaSem4(student.getSgpaSem4());
        dto.setSgpaSem5(student.getSgpaSem5());
        dto.setSgpaSem6(student.getSgpaSem6());
        dto.setSgpaSem7(student.getSgpaSem7());
        dto.setSgpaSem8(student.getSgpaSem8());
        dto.setCgpa(student.getCgpa());

        return dto;
    }
    private String formatYear(String year) {
        if (year == null || year.trim().isEmpty()) return "";
        String yStr = year.trim().toLowerCase();
        if (yStr.equals("1") || yStr.equals("1st") || yStr.equals("first_year") || yStr.equals("first year") || yStr.equals("1st year")) return "1st Year";
        if (yStr.equals("2") || yStr.equals("2nd") || yStr.equals("second_year") || yStr.equals("second year") || yStr.equals("2nd year")) return "2nd Year";
        if (yStr.equals("3") || yStr.equals("3rd") || yStr.equals("third_year") || yStr.equals("third year") || yStr.equals("3rd year")) return "3rd Year";
        if (yStr.equals("4") || yStr.equals("4th") || yStr.equals("fourth_year") || yStr.equals("fourth year") || yStr.equals("4th year")) return "4th Year";
        return year;
    }
}
