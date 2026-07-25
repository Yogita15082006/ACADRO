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
import java.util.UUID;

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
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Subject cards retrieved successfully", dtos));
    }
}
