package com.acronexus.service.impl;

import com.acronexus.dto.MetadataDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.MetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MetadataServiceImpl implements MetadataService {

    private final AcroClassRepository acroClassRepository;
    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final DegreeProgramRepository degreeProgramRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;

    @Override
    public MetadataDto getAllMetadata() {
        return MetadataDto.builder()
                .classes(getClasses())
                .batches(getBatches())
                .departments(getDepartments())
                .degrees(getDegrees())
                .academicYears(getAcademicYears())
                .semesters(getSemesters())
                .statuses(getStatuses())
                .subjects(getSubjects())
                .sections(getSections())
                .designations(getDesignations())
                .qualifications(getQualifications())
                .roles(getRoles())
                .build();
    }

    @Override
    public List<String> getClasses() {
        return acroClassRepository.findAll().stream()
                .filter(c -> c.getName() != null && !c.getName().trim().isEmpty())
                .map(c -> {
                    String name = c.getName().trim();
                    String sec = c.getSection() != null ? c.getSection().trim() : "";
                    if (!sec.isEmpty() && !name.toLowerCase().endsWith(sec.toLowerCase())) {
                        return name + "-" + sec;
                    }
                    return name;
                })
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getBatches() {
        return studentRepository.findAll().stream()
                .map(Student::getBatchYear)
                .filter(b -> b != null && !b.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getDepartments() {
        return departmentRepository.findAll().stream()
                .map(Department::getName)
                .filter(d -> d != null && !d.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getDegrees() {
        return degreeProgramRepository.findAll().stream()
                .map(DegreeProgram::getName)
                .filter(d -> d != null && !d.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAcademicYears() {
        return academicYearRepository.findAll().stream()
                .map(AcademicYear::getYear)
                .filter(y -> y != null && !y.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getSemesters() {
        return semesterRepository.findAll().stream()
                .map(Semester::getSemesterNumber)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getClassesByBatch(String batch) {
        if (batch == null || batch.trim().isEmpty()) {
            return getClasses();
        }
        
        List<Student> students = studentRepository.findByBatchYear(batch);
        return students.stream()
            .map(s -> studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(s.getId()))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(e -> {
                if (e.getAcroClass() != null) {
                    String name = e.getAcroClass().getName();
                    if (name != null) name = name.trim();
                    else return null;
                    
                    String sec = e.getAcroClass().getSection() != null ? e.getAcroClass().getSection().trim() : "";
                    if (!sec.isEmpty() && !name.toLowerCase().endsWith(sec.toLowerCase())) {
                        return name + "-" + sec;
                    }
                    return name;
                }
                return null;
            })
            .filter(name -> name != null && !name.trim().isEmpty())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    @Override
    public List<String> getClassesBySemester(String batch, String semester) {
        return getClassesByBatch(batch);
    }

    @Override
    public List<String> getAcademicYearsByBatch(String batch) {
        // Standardize Academic Years as requested. We return these specific strings.
        return List.of("1", "2", "3", "4");
    }

    @Override
    public List<String> getSemestersByYear(String year) {
        if (year == null || year.trim().isEmpty()) {
            return getSemesters();
        }
        
        // Map Academic Year to typical Semesters
        if (year.equals("1") || year.equals("First Year")) {
            return List.of("1", "2");
        } else if (year.equals("2") || year.equals("Second Year")) {
            return List.of("3", "4");
        } else if (year.equals("3") || year.equals("Third Year")) {
            return List.of("5", "6");
        } else if (year.equals("4") || year.equals("Fourth Year")) {
            return List.of("7", "8");
        }
        
        return getSemesters();
    }

    @Override
    public List<String> getStatuses() {
        List<String> statuses = userRepository.findAll().stream()
                .map(u -> u.getIsActive() != null && u.getIsActive() ? "Active" : "Inactive")
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        if (statuses.isEmpty()) {
            return List.of("Active", "Inactive");
        }
        return statuses;
    }

    @Override
    public List<String> getSubjects() {
        return subjectRepository.findAll().stream()
                .map(Subject::getName)
                .filter(s -> s != null && !s.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getSections() {
        return acroClassRepository.findAll().stream()
                .map(AcroClass::getSection)
                .filter(s -> s != null && !s.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getDesignations() {
        // In the system, role acts as designation, but we can also use Faculty entity's designation if it existed.
        // Actually, Faculty role is used heavily. Let's return roles mapped nicely.
        return getRoles();
    }

    @Override
    public List<String> getQualifications() {
        return facultyRepository.findAll().stream()
                .map(Faculty::getQualification)
                .filter(q -> q != null && !q.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getRoles() {
        return userRepository.findAll().stream()
                .map(User::getRole)
                .filter(r -> r != null && (r == UserRole.FACULTY || r == UserRole.COORDINATOR || r == UserRole.HOD))
                .map(r -> {
                    if (r == UserRole.FACULTY) return "Faculty";
                    if (r == UserRole.COORDINATOR) return "Coordinator";
                    if (r == UserRole.HOD) return "HOD";
                    return r.name();
                })
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
}
