package com.acronexus.controller;

import com.acronexus.dto.ClassSubjectRequestDto;
import com.acronexus.dto.ClassSubjectResponseDto;
import com.acronexus.service.ClassSubjectService;
import com.acronexus.entity.ClassSubject;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.entity.StudentEnrollment;
import com.acronexus.entity.CoordinatorAssignment;
import com.acronexus.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import lombok.RequiredArgsConstructor;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/class-subjects")
@RequiredArgsConstructor
public class ClassSubjectController {

    private final ClassSubjectService classSubjectService;
    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;

    @GetMapping
    public ResponseEntity<List<ClassSubjectResponseDto>> getAllWorkspaces() {
        return ResponseEntity.ok(classSubjectService.getAllWorkspaces());
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<ClassSubjectResponseDto>> getWorkspacesForFaculty(@PathVariable UUID facultyId) {
        return ResponseEntity.ok(classSubjectService.getWorkspacesForFaculty(facultyId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassSubjectResponseDto>> getWorkspacesForClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(classSubjectService.getWorkspacesForClass(classId));
    }

    @PostMapping
    public ResponseEntity<ClassSubjectResponseDto> createWorkspace(@RequestBody ClassSubjectRequestDto requestDto) {
        return ResponseEntity.ok(classSubjectService.createWorkspace(requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable UUID id) {
        classSubjectService.deleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-subjects")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'COORDINATOR')")
    @Operation(summary = "Get My Subject Cards", description = "Returns role-based subject assignments for cards.")
    public ResponseEntity<ApiResponse<List<ClassSubjectResponseDto>>> getMySubjects(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        List<ClassSubject> subjects = new ArrayList<>();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        
        if (role.equals("ROLE_ADMIN") || role.equals("ROLE_HOD")) {
            // HOD sees all active subjects
            subjects = classSubjectRepository.findAll().stream()
                .filter(cs -> Boolean.TRUE.equals(cs.getIsActive()))
                .collect(Collectors.toList());
        } else if (role.equals("ROLE_FACULTY")) {
            // Faculty sees their assigned subjects
            subjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(userDetails.getId());
        } else if (role.equals("ROLE_STUDENT")) {
            // Student sees subjects for their current class/semester
            StudentEnrollment enrollment = studentEnrollmentRepository.findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(userDetails.getId()).orElse(null);
            if (enrollment != null) {
                subjects = classSubjectRepository.findByAcroClassIdAndIsActiveTrue(enrollment.getAcroClass().getId()).stream()
                    .filter(cs -> cs.getSemester().getId().equals(enrollment.getSemester().getId()))
                    .collect(Collectors.toList());
            }
        } else if (role.equals("ROLE_COORDINATOR")) {
            // Coordinator sees their coordinated classes + teaching subjects
            subjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(userDetails.getId());
            List<CoordinatorAssignment> coords = coordinatorAssignmentRepository.findByCoordinatorId(userDetails.getId());
            for (CoordinatorAssignment ca : coords) {
                if (Boolean.TRUE.equals(ca.getIsActive())) {
                    List<ClassSubject> classSubjects = classSubjectRepository.findAll().stream()
                        .filter(cs -> Boolean.TRUE.equals(cs.getIsActive()) && cs.getAcroClass().getName().equals(ca.getClassName()))
                        .collect(Collectors.toList());
                    subjects.addAll(classSubjects);
                }
            }
            subjects = subjects.stream().distinct().collect(Collectors.toList());
        }

        List<ClassSubjectResponseDto> dtos = subjects.stream().map(cs -> {
            ClassSubjectResponseDto dto = new ClassSubjectResponseDto();
            dto.setId(cs.getId());
            if (cs.getAcroClass() != null) {
                dto.setClassId(cs.getAcroClass().getId());
                dto.setClassName(cs.getAcroClass().getName());
            }
            if (cs.getAcademicYear() != null) dto.setYear(String.valueOf(cs.getAcademicYear().getYear()));
            if (cs.getSemester() != null) dto.setSemester(String.valueOf(cs.getSemester().getSemesterNumber()));
            if (cs.getSubject() != null) {
                dto.setSubjectId(cs.getSubject().getId());
                dto.setSubjectName(cs.getSubject().getName());
                dto.setSubjectCode(cs.getSubject().getCode());
            }
            if (cs.getFaculty() != null && cs.getFaculty().getUser() != null) {
                dto.setFacultyId(cs.getFaculty().getId());
                dto.setFacultyName(cs.getFaculty().getUser().getFirstName() + " " + cs.getFaculty().getUser().getLastName());
            }
            
            // Map additional metadata for Subject Cards
            if (cs.getAcroClass() != null) {
                if (cs.getAcroClass().getDepartment() != null) {
                    dto.setDepartment(cs.getAcroClass().getDepartment().getName());
                }
                // For class section, fallback to className if not explicitly tracked
                dto.setClassSection(cs.getAcroClass().getName());
            }
            
            // Map Coordinator name (first active one for the class/semester/year)
            if (cs.getAcroClass() != null && cs.getSemester() != null && cs.getAcademicYear() != null) {
                coordinatorAssignmentRepository.findByClassNameAndIsActiveTrue(cs.getAcroClass().getName()).stream()
                    .filter(ca -> java.util.Objects.equals(ca.getSemester(), "Semester " + cs.getSemester().getSemesterNumber()) &&
                                  java.util.Objects.equals(ca.getAcademicYear(), cs.getAcademicYear().getYear()))
                    .findFirst()
                    .ifPresent(ca -> {
                        log.info("Mapping subject {} (class {}) to coordinator {}, batch {}", cs.getSubject().getName(), cs.getAcroClass().getName(), ca.getCoordinator() != null ? ca.getCoordinator().getFirstName() : "null", ca.getBatch());
                        dto.setBatch(ca.getBatch());
                        if (ca.getCoordinator() != null) {
                            dto.setCoordinatorName(ca.getCoordinator().getFirstName() + " " + ca.getCoordinator().getLastName());
                        }
                    });
            }
            
            try {
                dto.setLinkedSyllabus(classSubjectService.getSubjectSyllabus(cs.getId()));
            } catch (Exception ignored) {}

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Subject cards retrieved successfully", dtos));
    }

    @GetMapping("/{id}/syllabus")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'COORDINATOR')")
    @Operation(summary = "Get Subject Syllabus", description = "Returns the linked syllabus for a specific subject card.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSubjectSyllabus(@PathVariable UUID id) {
        Map<String, Object> result = classSubjectService.getSubjectSyllabus(id);
        if (result == null) {
            return ResponseEntity.ok(ApiResponse.success("No syllabus available for this subject.", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Syllabus retrieved successfully", result));
    }

    @GetMapping("/match-syllabus")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'COORDINATOR')")
    @Operation(summary = "Match Subject Syllabus", description = "Returns the matched syllabus given subject parameters.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> matchSyllabus(
            @RequestParam(required = false) String subjectCode,
            @RequestParam(required = false) String subjectName,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String batch,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String className) {
        Map<String, Object> result = classSubjectService.getMatchedSyllabusByParams(subjectCode, subjectName, department, batch, year, semester, className);
        if (result == null) {
            return ResponseEntity.ok(ApiResponse.success("No syllabus available for this subject.", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Syllabus matched successfully", result));
    }
}
