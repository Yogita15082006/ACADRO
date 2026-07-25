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
        return enrollmentRepository.findDistinctActiveClasses();
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
        }
        
        dto.setBatch(student.getBatchYear());

        // Get latest active enrollment for class info
        enrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(student.getId())
            .ifPresent(enrollment -> {
                if (enrollment.getAcroClass() != null) {
                    String name = enrollment.getAcroClass().getName();
                    String sec = enrollment.getAcroClass().getSection();
                    if (sec != null && !sec.trim().isEmpty() && !name.toLowerCase().endsWith(sec.toLowerCase())) {
                        dto.setClassName(name + "-" + sec);
                    } else {
                        dto.setClassName(name);
                    }
                }
                if (enrollment.getAcademicYear() != null) {
                    dto.setYear(enrollment.getAcademicYear().getYear());
                }
                if (enrollment.getSemester() != null) {
                    dto.setSemester(String.valueOf(enrollment.getSemester().getSemesterNumber()));
                }
            });

        if (dto.getClassName() == null && student.getCourse() != null) {
            String course = student.getCourse();
            String sec = student.getSection();
            if (sec != null && !sec.trim().isEmpty() && !course.toLowerCase().endsWith(sec.toLowerCase())) {
                dto.setClassName(course + "-" + sec);
            } else {
                dto.setClassName(course);
            }
        }

        if (dto.getClassName() == null) dto.setClassName("Unassigned");

        return dto;
    }
}
