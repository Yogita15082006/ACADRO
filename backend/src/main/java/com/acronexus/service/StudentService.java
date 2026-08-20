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
