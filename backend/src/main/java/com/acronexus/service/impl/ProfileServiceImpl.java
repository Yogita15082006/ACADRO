package com.acronexus.service.impl;

import com.acronexus.dto.profile.ProfileDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.acronexus.service.AttendanceDashboardService;
import com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto;
import org.springframework.context.annotation.Lazy;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FamilyDetailsRepository familyDetailsRepository;
    private final AddressDetailsRepository addressDetailsRepository;
    private final StudentProjectRepository studentProjectRepository;
    private final StudentInternshipRepository studentInternshipRepository;
    private final StudentCertificationRepository studentCertificationRepository;
    private final StudentAchievementRepository studentAchievementRepository;
    private final AcademicRecordRepository academicRecordRepository;
    private final FileStorageRepository fileStorageRepository;
    private final FacultyRepository facultyRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    
    @Lazy
    private final AttendanceDashboardService attendanceDashboardService;

    @Override
    @Transactional(readOnly = true)
    public ProfileDto getFullProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ProfileDto.ProfileDtoBuilder builder = ProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .gender(user.getGender())
                .dob(user.getDob())
                .bloodGroup(user.getBloodGroup())
                .profilePictureUrl(user.getProfilePictureUrl())
                .category(user.getCategory())
                .nationality(user.getNationality())
                .religion(user.getReligion())
                .aadhaarNumber(user.getAadhaarNumber())
                .residenceType(user.getResidenceType())
                .whatsappNumber(user.getWhatsappNumber())
                .personalEmail(user.getPersonalEmail())
                .collegeEmail(user.getCollegeEmail())
                .documents(user.getUploadedDocuments());
                
        if (user.getDepartment() != null) {
            String deptName = user.getDepartment().getName();
            builder.departmentName(deptName);
            builder.department(deptName);
            builder.branch(deptName);
        }

        // Faculty Departments
        if ("FACULTY".equals(user.getRole().name()) || "HOD".equals(user.getRole().name()) || "COORDINATOR".equals(user.getRole().name()) || "ROLE_FACULTY".equals(user.getRole().name()) || "ROLE_HOD".equals(user.getRole().name()) || "ROLE_COORDINATOR".equals(user.getRole().name())) {
            facultyRepository.findById(userId).ifPresent(faculty -> {
                builder.employeeId(faculty.getEmployeeId());
                if (faculty.getDepartments() != null && !faculty.getDepartments().isEmpty()) {
                    List<java.util.Map<String, Object>> depts = faculty.getDepartments().stream().map(d -> {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", d.getId().toString());
                        map.put("name", d.getName());
                        return map;
                    }).collect(Collectors.toList());
                    builder.departments(depts);
                }
            });
        }
        
        if ("COORDINATOR".equals(user.getRole().name()) || "ROLE_COORDINATOR".equals(user.getRole().name())) {
            java.util.List<com.acronexus.entity.CoordinatorAssignment> assignments = coordinatorAssignmentRepository.findByCoordinatorId(userId);
            java.util.List<ProfileDto.CoordinatorAssignmentDto> dtos = assignments.stream()
                .filter(a -> a.getIsActive() != null && a.getIsActive())
                .map(a -> {
                    ProfileDto.CoordinatorAssignmentDto dto = new ProfileDto.CoordinatorAssignmentDto();
                    dto.setBatch(a.getBatch());
                    dto.setAcademicYear(a.getAcademicYear());
                    dto.setSemester(a.getSemester());
                    dto.setClassName(a.getClassName());
                    return dto;
                }).collect(Collectors.toList());
            builder.coordinatorAssignments(dtos);
        }

        // Family Details
        familyDetailsRepository.findById(userId).ifPresent(family -> {
            ProfileDto.FamilyDetailsDto fd = new ProfileDto.FamilyDetailsDto();
            fd.setFatherName(family.getFatherName());
            fd.setFatherMobile(family.getFatherMobile());
            fd.setFatherOccupation(family.getFatherOccupation());
            fd.setFatherDesignation(family.getFatherDesignation());
            fd.setFatherOrganization(family.getFatherOrganization());
            fd.setMotherName(family.getMotherName());
            fd.setMotherMobile(family.getMotherMobile());
            fd.setMotherOccupation(family.getMotherOccupation());
            fd.setMotherDesignation(family.getMotherDesignation());
            fd.setMotherOrganization(family.getMotherOrganization());
            fd.setFamilyStatus(family.getFamilyStatus());
            fd.setNumberOfBrothers(family.getNumberOfBrothers());
            fd.setNumberOfSisters(family.getNumberOfSisters());
            fd.setAnnualIncome(family.getAnnualIncome());
            builder.familyDetails(fd);
        });

        // Address Details
        addressDetailsRepository.findById(userId).ifPresent(address -> {
            ProfileDto.AddressDetailsDto ad = new ProfileDto.AddressDetailsDto();
            ad.setLocalAddress(address.getLocalAddress());
            ad.setLocalCity(address.getLocalCity());
            ad.setLocalState(address.getLocalState());
            ad.setLocalPincode(address.getLocalPincode());
            ad.setPermanentAddress(address.getPermanentAddress());
            ad.setPermanentCity(address.getPermanentCity());
            ad.setPermanentState(address.getPermanentState());
            ad.setPermanentPincode(address.getPermanentPincode());
            builder.addressDetails(ad);
        });

        // Student Specific
        if ("STUDENT".equals(user.getRole().name()) || "ROLE_STUDENT".equals(user.getRole().name())) {
            studentRepository.findById(userId).ifPresent(student -> {
                builder.enrollmentNo(student.getEnrollmentNo());
                builder.rollNo(student.getRollNo());
                builder.batchYear(student.getBatchYear());
                builder.admissionYear(student.getAdmissionYear() != null ? student.getAdmissionYear() : student.getBatchYear());
                builder.instituteEnrollment(student.getInstituteEnrollment());
                builder.course(student.getCourse());
                builder.currentSemester(student.getCurrentSemester());
                builder.section(student.getSection());
                
                studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                    .ifPresent(enrollment -> {
                        if (enrollment.getAcroClass() != null) {
                            builder.className(enrollment.getAcroClass().getName());
                            // Do not overwrite builder.section() as it might be needed by older code,
                            // but we can set it if it's currently used in DTO
                        }
                        if (enrollment.getSemester() != null) {
                            builder.semesterName(String.valueOf(enrollment.getSemester().getSemesterNumber()));
                        }
                        if (enrollment.getAcademicYear() != null) {
                            builder.academicYearString(enrollment.getAcademicYear().getYear());
                        }
                    });

                if (student.getTechnicalSkills() != null && !student.getTechnicalSkills().trim().isEmpty()) {
                    builder.skills(java.util.Arrays.asList(student.getTechnicalSkills().split(",")));
                } else {
                    builder.skills(new java.util.ArrayList<>());
                }
                builder.hobbies(student.getHobbies());
                builder.clubs(student.getClubs());

                builder.linkedin(student.getLinkedin());
                builder.github(student.getGithub());
                builder.portfolio(student.getPortfolio());
                builder.leetcode(student.getLeetcode());
                builder.hackerrank(student.getHackerrank());
                if (student.getDomains() != null && !student.getDomains().trim().isEmpty()) {
                    builder.domains(java.util.Arrays.asList(student.getDomains().split(",")));
                } else {
                    builder.domains(new java.util.ArrayList<>());
                }
                builder.jobPreferences(student.getJobPreferences());
                builder.relocation(student.getRelocation());
                builder.resumeFileName(student.getResumeFileName());
                builder.resumeUploadedAt(student.getResumeUploadedAt());
                builder.resumeUrl(student.getResumeUrl());


                
                builder.activeBacklogs(student.getActiveBacklogs());
                builder.historyBacklogs(student.getHistoryBacklogs());
                builder.studyGap(student.getStudyGap());
                builder.batchCoordinator(student.getBatchCoordinator());
                builder.cgpa(student.getCgpa());
                
                if (student.getCurrentSubjects() != null && !student.getCurrentSubjects().trim().isEmpty()) {
                    builder.subjects(java.util.Arrays.asList(student.getCurrentSubjects().split(",")));
                } else {
                    builder.subjects(new java.util.ArrayList<>());
                }

                ProfileDto.SgpaDto sgpaDto = new ProfileDto.SgpaDto();
                sgpaDto.setSem1(student.getSgpaSem1());
                sgpaDto.setSem2(student.getSgpaSem2());
                sgpaDto.setSem3(student.getSgpaSem3());
                sgpaDto.setSem4(student.getSgpaSem4());
                sgpaDto.setSem5(student.getSgpaSem5());
                sgpaDto.setSem6(student.getSgpaSem6());
                sgpaDto.setSem7(student.getSgpaSem7());
                sgpaDto.setSem8(student.getSgpaSem8());
                builder.sgpa(sgpaDto);

                // Academic Records (10th/12th)
                List<AcademicRecord> records = academicRecordRepository.findByStudentId(userId);
                for (AcademicRecord record : records) {
                    if ("10TH".equalsIgnoreCase(record.getEducationLevel())) {
                        builder.tenthSchoolName(record.getInstitutionName());
                        builder.tenthBoard(record.getBoardName());
                        builder.tenthYear(String.valueOf(record.getPassingYear()));
                        if (record.getPercentage() != null) {
                            builder.tenthPercentage(record.getPercentage().toString());
                        }
                    } else if ("12TH".equalsIgnoreCase(record.getEducationLevel()) || "DIPLOMA".equalsIgnoreCase(record.getEducationLevel())) {
                        builder.twelfthSchoolName(record.getInstitutionName());
                        builder.twelfthBoard(record.getBoardName());
                        builder.twelfthYear(String.valueOf(record.getPassingYear()));
                        if (record.getPercentage() != null) {
                            builder.twelfthPercentage(record.getPercentage().toString());
                        }
                    }
                }

                // Projects
                List<ProfileDto.StudentProjectDto> projects = studentProjectRepository.findByStudentId(userId).stream().map(p -> {
                    ProfileDto.StudentProjectDto dto = new ProfileDto.StudentProjectDto();
                    dto.setId(p.getId());
                    dto.setTitle(p.getTitle());
                    dto.setDescription(p.getDescription());
                    dto.setTechStack(p.getTechStack());
                    dto.setGithubLink(p.getGithubLink());
                    dto.setLiveLink(p.getLiveLink());
                    return dto;
                }).collect(Collectors.toList());
                builder.projects(projects);

                // Internships
                List<ProfileDto.StudentInternshipDto> internships = studentInternshipRepository.findByStudentId(userId).stream().map(i -> {
                    ProfileDto.StudentInternshipDto dto = new ProfileDto.StudentInternshipDto();
                    dto.setId(i.getId());
                    dto.setRole(i.getRole());
                    dto.setCompany(i.getCompany());
                    dto.setMentor(i.getMentor());
                    dto.setDuration(i.getDuration());
                    dto.setTechnologies(i.getTechnologies());
                    dto.setDescription(i.getDescription());
                    dto.setLink(i.getLink());
                    return dto;
                }).collect(Collectors.toList());
                builder.internships(internships);

                // Certifications
                List<ProfileDto.StudentCertificationDto> certifications = studentCertificationRepository.findByStudentId(userId).stream().map(c -> {
                    ProfileDto.StudentCertificationDto dto = new ProfileDto.StudentCertificationDto();
                    dto.setId(c.getId());
                    dto.setTitle(c.getTitle());
                    dto.setIssuer(c.getIssuer());
                    dto.setDate(c.getDate());
                    dto.setLink(c.getLink());
                    return dto;
                }).collect(Collectors.toList());
                builder.certifications(certifications);

                // Achievements
                List<ProfileDto.StudentAchievementDto> achievements = studentAchievementRepository.findByStudentId(userId).stream().map(a -> {
                    ProfileDto.StudentAchievementDto dto = new ProfileDto.StudentAchievementDto();
                    dto.setId(a.getId());
                    dto.setTitle(a.getTitle());
                    dto.setCategory(a.getCategory());
                    dto.setDate(a.getDate());
                    dto.setDescription(a.getDescription());
                    dto.setLink(a.getLink());
                    return dto;
                }).collect(Collectors.toList());
                builder.achievements(achievements);
            });

            // Academic Stats (Always fetch, even if Student entity doesn't exist yet)
            try {
                com.acronexus.dto.AttendanceDashboardDto.OverallAttendanceDto attendance = attendanceDashboardService.getStudentOverallAttendance(userId, null, null);
                if (attendance != null) {
                    builder.overallAttendance(attendance.getOverallPercentage());
                    builder.totalClassesConducted(attendance.getTotalClasses());
                    builder.totalClassesAttended(attendance.getTotalPresent());
                }
            } catch (Exception e) {
                System.err.println("Error fetching attendance for user " + userId + ": " + e.getMessage());
                e.printStackTrace();
                // Ignore attendance fetch errors to prevent profile failure
            }
        }

        return builder.build();
    }

    @Override
    @Transactional
    public ProfileDto updateFullProfile(UUID userId, ProfileDto profileDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (profileDto.getFirstName() != null) user.setFirstName(profileDto.getFirstName());
        if (profileDto.getLastName() != null) user.setLastName(profileDto.getLastName());
        if (profileDto.getPhone() != null) user.setPhone(profileDto.getPhone());
        if (profileDto.getGender() != null) user.setGender(profileDto.getGender());
        if (profileDto.getDob() != null) user.setDob(profileDto.getDob());
        if (profileDto.getBloodGroup() != null) user.setBloodGroup(profileDto.getBloodGroup());
        if (profileDto.getCategory() != null) user.setCategory(profileDto.getCategory());
        if (profileDto.getNationality() != null) user.setNationality(profileDto.getNationality());
        if (profileDto.getReligion() != null) user.setReligion(profileDto.getReligion());
        if (profileDto.getAadhaarNumber() != null) user.setAadhaarNumber(profileDto.getAadhaarNumber());
        if (profileDto.getResidenceType() != null) user.setResidenceType(profileDto.getResidenceType());
        if (profileDto.getWhatsappNumber() != null) user.setWhatsappNumber(profileDto.getWhatsappNumber());
        if (profileDto.getPersonalEmail() != null) user.setPersonalEmail(profileDto.getPersonalEmail());
        if (profileDto.getCollegeEmail() != null) user.setCollegeEmail(profileDto.getCollegeEmail());
        
        if (profileDto.getDocuments() != null) {
            user.setUploadedDocuments(profileDto.getDocuments());
        }

        userRepository.save(user);

        // Family Details
        if (profileDto.getFamilyDetails() != null) {
            boolean isNewFamily = false;
            FamilyDetails family = familyDetailsRepository.findById(userId).orElse(null);
            if (family == null) {
                family = new FamilyDetails();
                isNewFamily = true;
            }
            family.setUser(user);
            if (isNewFamily) {
                family.setIsNewEntity(true);
            }
            ProfileDto.FamilyDetailsDto fd = profileDto.getFamilyDetails();
            if (fd.getFatherName() != null) family.setFatherName(fd.getFatherName());
            if (fd.getFatherMobile() != null) family.setFatherMobile(fd.getFatherMobile());
            if (fd.getFatherOccupation() != null) family.setFatherOccupation(fd.getFatherOccupation());
            if (fd.getFatherDesignation() != null) family.setFatherDesignation(fd.getFatherDesignation());
            if (fd.getFatherOrganization() != null) family.setFatherOrganization(fd.getFatherOrganization());
            if (fd.getMotherName() != null) family.setMotherName(fd.getMotherName());
            if (fd.getMotherMobile() != null) family.setMotherMobile(fd.getMotherMobile());
            if (fd.getMotherOccupation() != null) family.setMotherOccupation(fd.getMotherOccupation());
            if (fd.getMotherDesignation() != null) family.setMotherDesignation(fd.getMotherDesignation());
            if (fd.getMotherOrganization() != null) family.setMotherOrganization(fd.getMotherOrganization());
            if (fd.getFamilyStatus() != null) family.setFamilyStatus(fd.getFamilyStatus());
            if (fd.getNumberOfBrothers() != null) family.setNumberOfBrothers(fd.getNumberOfBrothers());
            if (fd.getNumberOfSisters() != null) family.setNumberOfSisters(fd.getNumberOfSisters());
            if (fd.getAnnualIncome() != null) family.setAnnualIncome(fd.getAnnualIncome());
            familyDetailsRepository.save(family);
        }

        // Address Details
        if (profileDto.getAddressDetails() != null) {
            boolean isNewAddress = false;
            AddressDetails address = addressDetailsRepository.findById(userId).orElse(null);
            if (address == null) {
                address = new AddressDetails();
                isNewAddress = true;
            }
            address.setUser(user);
            if (isNewAddress) {
                address.setIsNewEntity(true);
            }
            ProfileDto.AddressDetailsDto ad = profileDto.getAddressDetails();
            if (ad.getLocalAddress() != null) address.setLocalAddress(ad.getLocalAddress());
            if (ad.getLocalCity() != null) address.setLocalCity(ad.getLocalCity());
            if (ad.getLocalState() != null) address.setLocalState(ad.getLocalState());
            if (ad.getLocalPincode() != null) address.setLocalPincode(ad.getLocalPincode());
            if (ad.getPermanentAddress() != null) address.setPermanentAddress(ad.getPermanentAddress());
            if (ad.getPermanentCity() != null) address.setPermanentCity(ad.getPermanentCity());
            if (ad.getPermanentState() != null) address.setPermanentState(ad.getPermanentState());
            if (ad.getPermanentPincode() != null) address.setPermanentPincode(ad.getPermanentPincode());
            addressDetailsRepository.save(address);
        }

        // Student Specific
        if ("STUDENT".equals(user.getRole().name()) || "ROLE_STUDENT".equals(user.getRole().name())) {
            boolean isNewStudent = false;
            Student student = studentRepository.findById(userId).orElse(null);
            if (student == null) {
                student = new Student();
                student.setId(userId);
                isNewStudent = true;
            }
            student.setUser(user);
            if (isNewStudent) {
                student.setIsNewEntity(true);
            }
            
            if (profileDto.getInstituteEnrollment() != null) student.setInstituteEnrollment(profileDto.getInstituteEnrollment());
            
            if (profileDto.getEnrollmentNo() != null) {
                student.setEnrollmentNo(profileDto.getEnrollmentNo());
            } else if (student.getEnrollmentNo() == null) {
                student.setEnrollmentNo(""); // Prevent null constraint violation
            }
            
            if (profileDto.getRollNo() != null) student.setRollNo(profileDto.getRollNo());
            
            if (profileDto.getBatchYear() != null) {
                student.setBatchYear(profileDto.getBatchYear());
            } else if (student.getBatchYear() == null) {
                student.setBatchYear(""); // Prevent null constraint violation
            }
            if (profileDto.getAdmissionYear() != null) student.setAdmissionYear(profileDto.getAdmissionYear());
            if (profileDto.getCourse() != null) student.setCourse(profileDto.getCourse());
            if (profileDto.getCurrentSemester() != null) student.setCurrentSemester(profileDto.getCurrentSemester());
            if (profileDto.getSection() != null) student.setSection(profileDto.getSection());
            if (profileDto.getSkills() != null) {
                student.setTechnicalSkills(String.join(",", profileDto.getSkills()));
            }
            if (profileDto.getHobbies() != null) student.setHobbies(profileDto.getHobbies());
            if (profileDto.getClubs() != null) student.setClubs(profileDto.getClubs());

            if (profileDto.getLinkedin() != null) student.setLinkedin(profileDto.getLinkedin());
            if (profileDto.getGithub() != null) student.setGithub(profileDto.getGithub());
            if (profileDto.getPortfolio() != null) student.setPortfolio(profileDto.getPortfolio());
            if (profileDto.getLeetcode() != null) student.setLeetcode(profileDto.getLeetcode());
            if (profileDto.getHackerrank() != null) student.setHackerrank(profileDto.getHackerrank());
            if (profileDto.getDomains() != null) {
                student.setDomains(String.join(",", profileDto.getDomains()));
            }
            if (profileDto.getJobPreferences() != null) student.setJobPreferences(profileDto.getJobPreferences());
            if (profileDto.getRelocation() != null) student.setRelocation(profileDto.getRelocation());
            if (profileDto.getResumeFileName() != null) student.setResumeFileName(profileDto.getResumeFileName());
            if (profileDto.getResumeUploadedAt() != null) student.setResumeUploadedAt(profileDto.getResumeUploadedAt());
            if (profileDto.getResumeUrl() != null) student.setResumeUrl(profileDto.getResumeUrl());

            if (profileDto.getActiveBacklogs() != null) student.setActiveBacklogs(profileDto.getActiveBacklogs());
            if (profileDto.getHistoryBacklogs() != null) student.setHistoryBacklogs(profileDto.getHistoryBacklogs());
            if (profileDto.getStudyGap() != null) student.setStudyGap(profileDto.getStudyGap());
            if (profileDto.getBatchCoordinator() != null) student.setBatchCoordinator(profileDto.getBatchCoordinator());
            
            if (profileDto.getCgpa() != null) {
                    student.setCgpa(profileDto.getCgpa());
                }

                if (profileDto.getSubjects() != null) {
                    student.setCurrentSubjects(String.join(",", profileDto.getSubjects()));
                }

                if (profileDto.getSgpa() != null) {
                    student.setSgpaSem1(profileDto.getSgpa().getSem1());
                    student.setSgpaSem2(profileDto.getSgpa().getSem2());
                    student.setSgpaSem3(profileDto.getSgpa().getSem3());
                    student.setSgpaSem4(profileDto.getSgpa().getSem4());
                    student.setSgpaSem5(profileDto.getSgpa().getSem5());
                    student.setSgpaSem6(profileDto.getSgpa().getSem6());
                    student.setSgpaSem7(profileDto.getSgpa().getSem7());
                    student.setSgpaSem8(profileDto.getSgpa().getSem8());
                }

                studentRepository.saveAndFlush(student);

                // Update Academic Records (10th/12th)
                List<AcademicRecord> existingRecords = academicRecordRepository.findByStudentId(userId);
                
                // 10th
                if (profileDto.getTenthSchoolName() != null && !profileDto.getTenthSchoolName().trim().isEmpty()) {
                    AcademicRecord tenth = existingRecords.stream()
                        .filter(r -> "10TH".equalsIgnoreCase(r.getEducationLevel()))
                        .findFirst().orElse(new AcademicRecord());
                    tenth.setStudent(student);
                    tenth.setEducationLevel("10TH");
                    tenth.setInstitutionName(profileDto.getTenthSchoolName());
                    tenth.setBoardName(profileDto.getTenthBoard());
                    try {
                        if (profileDto.getTenthYear() != null) tenth.setPassingYear(Integer.parseInt(profileDto.getTenthYear()));
                        if (profileDto.getTenthPercentage() != null) tenth.setPercentage(new java.math.BigDecimal(profileDto.getTenthPercentage()));
                    } catch (Exception e) {}
                    academicRecordRepository.save(tenth);
                }

                // 12th
                if (profileDto.getTwelfthSchoolName() != null && !profileDto.getTwelfthSchoolName().trim().isEmpty()) {
                    AcademicRecord twelfth = existingRecords.stream()
                        .filter(r -> "12TH".equalsIgnoreCase(r.getEducationLevel()) || "DIPLOMA".equalsIgnoreCase(r.getEducationLevel()))
                        .findFirst().orElse(new AcademicRecord());
                    twelfth.setStudent(student);
                    twelfth.setEducationLevel("12TH"); // Default to 12TH, maybe front-end should pass type but 12th is fine
                    twelfth.setInstitutionName(profileDto.getTwelfthSchoolName());
                    twelfth.setBoardName(profileDto.getTwelfthBoard());
                    try {
                        if (profileDto.getTwelfthYear() != null) twelfth.setPassingYear(Integer.parseInt(profileDto.getTwelfthYear()));
                        if (profileDto.getTwelfthPercentage() != null) twelfth.setPercentage(new java.math.BigDecimal(profileDto.getTwelfthPercentage()));
                    } catch (Exception e) {}
                    academicRecordRepository.save(twelfth);
                }

                // Note: For full arrays like Projects/Internships/etc, we typically replace them or merge them.
                // In a simplified approach, we just delete all and insert new ones if they are provided,
                // or update existing ones based on ID. Since frontend might not send IDs correctly for new items,
                // we'll delete and re-insert if the array is present.
                if (profileDto.getProjects() != null) {
                    studentProjectRepository.deleteAll(studentProjectRepository.findByStudentId(userId));
                    for (ProfileDto.StudentProjectDto p : profileDto.getProjects()) {
                        StudentProject sp = new StudentProject();
                        sp.setStudent(student);
                        sp.setTitle(p.getTitle());
                        sp.setDescription(p.getDescription());
                        sp.setTechStack(p.getTechStack());
                        sp.setGithubLink(p.getGithubLink());
                        sp.setLiveLink(p.getLiveLink());
                        studentProjectRepository.save(sp);
                    }
                }

                if (profileDto.getInternships() != null) {
                    studentInternshipRepository.deleteAll(studentInternshipRepository.findByStudentId(userId));
                    for (ProfileDto.StudentInternshipDto i : profileDto.getInternships()) {
                        StudentInternship si = new StudentInternship();
                        si.setStudent(student);
                        si.setRole(i.getRole());
                        si.setCompany(i.getCompany());
                        si.setMentor(i.getMentor());
                        si.setDuration(i.getDuration());
                        si.setTechnologies(i.getTechnologies());
                        si.setDescription(i.getDescription());
                        si.setLink(i.getLink());
                        studentInternshipRepository.save(si);
                    }
                }

                if (profileDto.getCertifications() != null) {
                    studentCertificationRepository.deleteAll(studentCertificationRepository.findByStudentId(userId));
                    for (ProfileDto.StudentCertificationDto c : profileDto.getCertifications()) {
                        StudentCertification sc = new StudentCertification();
                        sc.setStudent(student);
                        sc.setTitle(c.getTitle());
                        sc.setIssuer(c.getIssuer());
                        sc.setDate(c.getDate());
                        sc.setLink(c.getLink());
                        studentCertificationRepository.save(sc);
                    }
                }

                if (profileDto.getAchievements() != null) {
                    studentAchievementRepository.deleteAll(studentAchievementRepository.findByStudentId(userId));
                    for (ProfileDto.StudentAchievementDto a : profileDto.getAchievements()) {
                        StudentAchievement sa = new StudentAchievement();
                        sa.setStudent(student);
                        sa.setTitle(a.getTitle());
                        sa.setCategory(a.getCategory());
                        sa.setDate(a.getDate());
                        sa.setDescription(a.getDescription());
                        sa.setLink(a.getLink());
                        studentAchievementRepository.save(sa);
                    }
                }
        }

        return getFullProfile(userId);
    }

    @Override
    @Transactional
    public String uploadProfilePhoto(UUID userId, org.springframework.web.multipart.MultipartFile file) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String uploadDir = "uploads/profiles/";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath);

            FileStorage fs = new FileStorage();
            fs.setFileName(file.getOriginalFilename());
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType("PROFILE_PHOTO");
            fs.setUploadedBy(user);
            fs.setUploadedAt(java.time.ZonedDateTime.now());
            fs.setIsActive(true);
            
            fileStorageRepository.save(fs);

            String photoUrl = "/api/v1/resources/download/" + fs.getId();
            user.setProfilePictureUrl(photoUrl);
            userRepository.save(user);

            return photoUrl;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store profile photo", e);
        }
    }

    @Override
    @Transactional
    public String uploadProfileDocument(UUID userId, org.springframework.web.multipart.MultipartFile file) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String uploadDir = "uploads/documents/";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath);

            FileStorage fs = new FileStorage();
            fs.setFileName(file.getOriginalFilename());
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType("PROFILE_DOCUMENT");
            fs.setUploadedBy(user);
            fs.setUploadedAt(java.time.ZonedDateTime.now());
            fs.setIsActive(true);
            
            fileStorageRepository.save(fs);

            return "/api/v1/resources/download/" + fs.getId();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store profile document", e);
        }
    }
}
