package com.acronexus.service;

import com.acronexus.dto.ClassSubjectRequestDto;
import com.acronexus.dto.ClassSubjectResponseDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassSubjectService {

    private final ClassSubjectRepository classSubjectRepository;
    private final AcroClassRepository acroClassRepository;
    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;

    public List<ClassSubjectResponseDto> getAllWorkspaces() {
        return classSubjectRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ClassSubjectResponseDto> getWorkspacesForFaculty(UUID facultyId) {
        return classSubjectRepository.findByFacultyIdAndIsActiveTrue(facultyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ClassSubjectResponseDto> getWorkspacesForClass(UUID classId) {
        return classSubjectRepository.findByAcroClassIdAndIsActiveTrue(classId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ClassSubjectResponseDto createWorkspace(ClassSubjectRequestDto dto) {
        AcroClass acroClass = acroClassRepository.findById(dto.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        AcademicYear academicYear = academicYearRepository.findById(dto.getAcademicYearId())
                .orElseThrow(() -> new RuntimeException("Academic Year not found"));
        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        ClassSubject classSubject = new ClassSubject();
        classSubject.setAcroClass(acroClass);
        classSubject.setSubject(subject);
        classSubject.setFaculty(faculty);
        classSubject.setAcademicYear(academicYear);
        classSubject.setSemester(semester);
        classSubject.setEffectiveFrom(dto.getEffectiveFrom());
        classSubject.setEffectiveTo(dto.getEffectiveTo());
        classSubject.setIsActive(true);

        ClassSubject saved = classSubjectRepository.save(classSubject);
        return mapToDto(saved);
    }

    public void deleteWorkspace(UUID id) {
        classSubjectRepository.deleteById(id);
    }

    private ClassSubjectResponseDto mapToDto(ClassSubject classSubject) {
        ClassSubjectResponseDto dto = new ClassSubjectResponseDto();
        dto.setId(classSubject.getId());

        if (classSubject.getAcroClass() != null) {
            dto.setClassId(classSubject.getAcroClass().getId());
            dto.setClassName(classSubject.getAcroClass().getName() + " - " + classSubject.getAcroClass().getSection());
            
            List<CoordinatorAssignment> coordinatorAssignments = coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(classSubject.getAcroClass().getName());
            if (!coordinatorAssignments.isEmpty()) {
                CoordinatorAssignment ca = coordinatorAssignments.get(0);
                if (ca.getCoordinator() != null) {
                    User coordinator = ca.getCoordinator();
                    dto.setCoordinatorName(coordinator.getFirstName() + " " + coordinator.getLastName());
                }
                if (ca.getBatch() != null) {
                    dto.setBatch(ca.getBatch());
                }
            }
        }

        if (classSubject.getSubject() != null) {
            dto.setSubjectId(classSubject.getSubject().getId());
            dto.setSubjectName(classSubject.getSubject().getName());
            dto.setSubjectCode(classSubject.getSubject().getCode());
        }

        if (classSubject.getFaculty() != null && classSubject.getFaculty().getUser() != null) {
            dto.setFacultyId(classSubject.getFaculty().getId());
            dto.setFacultyName(classSubject.getFaculty().getUser().getFirstName() + " " + classSubject.getFaculty().getUser().getLastName());
        }

        if (classSubject.getAcademicYear() != null) {
            dto.setYear(classSubject.getAcademicYear().getYear());
        }

        if (classSubject.getSemester() != null) {
            dto.setSemester("Semester " + classSubject.getSemester().getSemesterNumber());
        }
        
        if (classSubject.getAcroClass() != null && classSubject.getAcroClass().getDegreeProgram() != null && classSubject.getAcroClass().getDegreeProgram().getDepartment() != null) {
            dto.setDepartment(classSubject.getAcroClass().getDegreeProgram().getDepartment().getName());
        }
        
        dto.setGenerationType("manual");

        return dto;
    }
}
