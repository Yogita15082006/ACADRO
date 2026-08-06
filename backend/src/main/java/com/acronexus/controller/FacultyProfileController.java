package com.acronexus.controller;

import com.acronexus.dto.response.AssignedSubjectDto;
import com.acronexus.dto.response.FacultyActivityRecordDto;
import com.acronexus.entity.*;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/faculty-profile")
@RequiredArgsConstructor
public class FacultyProfileController {

    private final ClassSubjectRepository classSubjectRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;

    @GetMapping("/assigned-subjects")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<AssignedSubjectDto>> getAssignedSubjects(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Faculty faculty = facultyRepository.findById(user.getId()).orElse(null);
        if (faculty == null) {
            return ResponseEntity.badRequest().build();
        }

        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(faculty.getId());

        List<AssignedSubjectDto> dtos = classSubjects.stream().map(cs -> {
            AssignedSubjectDto dto = new AssignedSubjectDto();
            dto.setId(cs.getId());
            dto.setFacultyId(faculty.getId());
            dto.setSubjectName(cs.getSubject().getName());
            dto.setClassName(cs.getAcroClass().getName());
            dto.setSemester(cs.getSemester().getSemesterNumber() != null ? "Semester " + cs.getSemester().getSemesterNumber() : "Unknown");
            dto.setAcademicYear(cs.getAcademicYear().getYear());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/activities")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<FacultyActivityRecordDto>> getActivities(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Faculty faculty = facultyRepository.findById(user.getId()).orElse(null);
        if (faculty == null) {
            return ResponseEntity.badRequest().build();
        }

        List<FacultyActivity> activities = facultyActivityRepository.findByFacultyIdOrderByDateDesc(faculty.getId());

        List<FacultyActivityRecordDto> dtos = activities.stream().map(activity -> {
            FacultyActivityRecordDto dto = new FacultyActivityRecordDto();
            dto.setId(activity.getId());
            dto.setFacultyId(faculty.getId());
            
            if (activity.getClassSubject() != null) {
                dto.setSubjectName(activity.getClassSubject().getSubject().getName());
                dto.setClassName(activity.getClassSubject().getAcroClass().getName());
                dto.setSemester(activity.getClassSubject().getSemester().getSemesterNumber() != null ? "Semester " + activity.getClassSubject().getSemester().getSemesterNumber() : "Unknown");
                dto.setAcademicYear(activity.getClassSubject().getAcademicYear().getYear());
            }

            dto.setDate(activity.getDate());
            
            switch (activity.getStatus()) {
                case PRESENT:
                    dto.setStatus("Present");
                    break;
                case CLASS_MISSED:
                    dto.setStatus("Class Missed");
                    break;
                case ABSENT:
                    dto.setStatus("Absent");
                    break;
                case HOLIDAY:
                    dto.setStatus("Holiday");
                    break;
                default:
                    dto.setStatus(activity.getStatus().name());
            }
            
            dto.setReason(activity.getReason());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
