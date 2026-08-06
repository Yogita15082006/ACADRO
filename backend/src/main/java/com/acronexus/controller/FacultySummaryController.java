package com.acronexus.controller;

import com.acronexus.entity.Faculty;
import com.acronexus.entity.ClassSubject;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.repository.ClassSubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/faculty-summary")
@RequiredArgsConstructor
public class FacultySummaryController {

    private final FacultyRepository facultyRepository;
    private final ClassSubjectRepository classSubjectRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR')")
    public ResponseEntity<List<Map<String, Object>>> getFacultySummary() {
        List<Faculty> faculties = facultyRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Faculty faculty : faculties) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", faculty.getId());
            if (faculty.getUser() != null) {
                map.put("name", faculty.getUser().getFirstName() + " " + faculty.getUser().getLastName());
                map.put("email", faculty.getUser().getEmail());
                map.put("avatar", faculty.getUser().getProfilePictureUrl());
                map.put("department", faculty.getUser().getDepartment() != null ? faculty.getUser().getDepartment().getName() : "Unknown");
            } else {
                map.put("name", "Unknown");
                map.put("email", "unknown");
                map.put("avatar", null);
                map.put("department", "Unknown");
            }
            map.put("employeeId", faculty.getEmployeeId());

            List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(faculty.getId());
            
            Set<String> assignedYears = new HashSet<>();
            Set<String> assignedSems = new HashSet<>();
            Set<String> assignedClasses = new HashSet<>();
            Set<String> assignedSubjects = new HashSet<>();

            for (ClassSubject cs : classSubjects) {
                if (cs.getAcademicYear() != null) assignedYears.add(cs.getAcademicYear().getYear().replace("YEAR_", ""));
                if (cs.getSemester() != null) assignedSems.add("Sem " + cs.getSemester().getSemesterNumber());
                if (cs.getAcroClass() != null) assignedClasses.add(cs.getAcroClass().getName());
                if (cs.getSubject() != null) assignedSubjects.add(cs.getSubject().getName());
            }

            map.put("assignedYears", assignedYears);
            map.put("assignedSems", assignedSems);
            map.put("assignedClasses", assignedClasses);
            map.put("assignedSubjects", assignedSubjects);

            response.add(map);
        }

        return ResponseEntity.ok(response);
    }
}
