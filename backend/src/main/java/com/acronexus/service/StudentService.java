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

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<StudentResponseDto> getAllStudents(String search, String batch, String className, String status, Pageable pageable) {
        return studentRepository.findAllWithFilters(search, batch, status, className, pageable)
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
        userRepository.save(user);
        
        Student savedStudent = studentRepository.save(student);
        return mapToDto(savedStudent);
    }

    @Transactional
    public void deleteStudent(UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        studentRepository.delete(student);
        userRepository.delete(student.getUser());
    }

    @Transactional
    public void deleteAllStudents() {
        enrollmentRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAllByRole(UserRole.STUDENT);
    }

    private StudentResponseDto mapToDto(Student student) {
        StudentResponseDto dto = new StudentResponseDto();
        dto.setId(student.getId());
        dto.setEnrollmentNumber(student.getEnrollmentNo());
        
        User user = student.getUser();
        if (user != null) {
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

        return dto;
    }
}
