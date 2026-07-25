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
            builder.departmentName(user.getDepartment().getName());
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
        if ("ROLE_STUDENT".equals(user.getRole().name())) {
            studentRepository.findById(userId).ifPresent(student -> {
                builder.enrollmentNo(student.getEnrollmentNo());
                builder.rollNo(student.getRollNo());
                builder.batchYear(student.getBatchYear());
                builder.instituteEnrollment(student.getInstituteEnrollment());
                builder.course(student.getCourse());
                builder.currentSemester(student.getCurrentSemester());
                builder.section(student.getSection());
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

                // Academic Stats
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
        }

        return builder.build();
    }

    @Override
    @Transactional
    public ProfileDto updateFullProfile(UUID userId, ProfileDto profileDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(profileDto.getFirstName());
        user.setLastName(profileDto.getLastName());
        user.setPhone(profileDto.getPhone());
        user.setGender(profileDto.getGender());
        user.setDob(profileDto.getDob());
        user.setBloodGroup(profileDto.getBloodGroup());
        user.setCategory(profileDto.getCategory());
        user.setNationality(profileDto.getNationality());
        user.setReligion(profileDto.getReligion());
        user.setAadhaarNumber(profileDto.getAadhaarNumber());
        user.setResidenceType(profileDto.getResidenceType());
        user.setWhatsappNumber(profileDto.getWhatsappNumber());
        user.setPersonalEmail(profileDto.getPersonalEmail());
        user.setCollegeEmail(profileDto.getCollegeEmail());
        
        if (profileDto.getDocuments() != null) {
            user.setUploadedDocuments(profileDto.getDocuments());
        }

        userRepository.save(user);

        // Family Details
        if (profileDto.getFamilyDetails() != null) {
            FamilyDetails family = familyDetailsRepository.findById(userId).orElse(new FamilyDetails());
            family.setId(userId);
            family.setUser(user);
            ProfileDto.FamilyDetailsDto fd = profileDto.getFamilyDetails();
            family.setFatherName(fd.getFatherName());
            family.setFatherMobile(fd.getFatherMobile());
            family.setFatherOccupation(fd.getFatherOccupation());
            family.setFatherDesignation(fd.getFatherDesignation());
            family.setFatherOrganization(fd.getFatherOrganization());
            family.setMotherName(fd.getMotherName());
            family.setMotherMobile(fd.getMotherMobile());
            family.setMotherOccupation(fd.getMotherOccupation());
            family.setMotherDesignation(fd.getMotherDesignation());
            family.setMotherOrganization(fd.getMotherOrganization());
            family.setFamilyStatus(fd.getFamilyStatus());
            family.setNumberOfBrothers(fd.getNumberOfBrothers());
            family.setNumberOfSisters(fd.getNumberOfSisters());
            family.setAnnualIncome(fd.getAnnualIncome());
            familyDetailsRepository.save(family);
        }

        // Address Details
        if (profileDto.getAddressDetails() != null) {
            AddressDetails address = addressDetailsRepository.findById(userId).orElse(new AddressDetails());
            address.setId(userId);
            address.setUser(user);
            ProfileDto.AddressDetailsDto ad = profileDto.getAddressDetails();
            address.setLocalAddress(ad.getLocalAddress());
            address.setLocalCity(ad.getLocalCity());
            address.setLocalState(ad.getLocalState());
            address.setLocalPincode(ad.getLocalPincode());
            address.setPermanentAddress(ad.getPermanentAddress());
            address.setPermanentCity(ad.getPermanentCity());
            address.setPermanentState(ad.getPermanentState());
            address.setPermanentPincode(ad.getPermanentPincode());
            addressDetailsRepository.save(address);
        }

        // Student Specific
        if ("ROLE_STUDENT".equals(user.getRole().name())) {
            Student student = studentRepository.findById(userId).orElse(null);
            if (student != null) {
                student.setInstituteEnrollment(profileDto.getInstituteEnrollment());
                student.setCourse(profileDto.getCourse());
                student.setCurrentSemester(profileDto.getCurrentSemester());
                student.setSection(profileDto.getSection());
                if (profileDto.getSkills() != null) {
                    student.setTechnicalSkills(String.join(",", profileDto.getSkills()));
                }
                student.setHobbies(profileDto.getHobbies());
                student.setClubs(profileDto.getClubs());

                student.setLinkedin(profileDto.getLinkedin());
                student.setGithub(profileDto.getGithub());
                student.setPortfolio(profileDto.getPortfolio());
                student.setLeetcode(profileDto.getLeetcode());
                student.setHackerrank(profileDto.getHackerrank());
                if (profileDto.getDomains() != null) {
                    student.setDomains(String.join(",", profileDto.getDomains()));
                }
                student.setJobPreferences(profileDto.getJobPreferences());
                student.setRelocation(profileDto.getRelocation());
                student.setResumeFileName(profileDto.getResumeFileName());
                student.setResumeUploadedAt(profileDto.getResumeUploadedAt());

                student.setActiveBacklogs(profileDto.getActiveBacklogs());
                student.setHistoryBacklogs(profileDto.getHistoryBacklogs());
                student.setStudyGap(profileDto.getStudyGap());
                student.setBatchCoordinator(profileDto.getBatchCoordinator());
                
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

                studentRepository.save(student);

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
        }

        return getFullProfile(userId);
    }
}
