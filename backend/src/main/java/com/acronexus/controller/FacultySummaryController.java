package com.acronexus.controller;

import com.acronexus.entity.Faculty;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.CoordinatorAssignment;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.service.AttendanceSessionService;
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

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final AttendanceSessionService attendanceSessionService;
    private final FacultyActivityRepository facultyActivityRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR')")
    public ResponseEntity<List<Map<String, Object>>> getFacultySummary() {
        List<UserRole> targetRoles = Arrays.asList(UserRole.FACULTY, UserRole.COORDINATOR);
        List<User> targetUsers = userRepository.findByRoleIn(targetRoles).stream()
                .filter(u -> (u.getIsActive() == null || u.getIsActive()) && (u.getIsDeleted() == null || !u.getIsDeleted()))
                .collect(Collectors.toList());
        
        List<Map<String, Object>> response = new ArrayList<>();

        for (User user : targetUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getFirstName() + " " + user.getLastName());
            map.put("email", user.getEmail());
            map.put("avatar", user.getProfilePictureUrl());
            map.put("department", user.getDepartment() != null ? user.getDepartment().getName() : "Unknown");
            map.put("role", user.getRole().name());

            Optional<Faculty> facultyOpt = facultyRepository.findById(user.getId());
            map.put("employeeId", facultyOpt.map(Faculty::getEmployeeId).orElse("N/A"));

            List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(user.getId());
            List<CoordinatorAssignment> coordAssignments = coordinatorAssignmentRepository.findByCoordinatorId(user.getId());
            
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

            for (CoordinatorAssignment ca : coordAssignments) {
                if (ca.getAcademicYear() != null) assignedYears.add(ca.getAcademicYear().replace("YEAR_", ""));
                if (ca.getSemester() != null) assignedSems.add("Sem " + ca.getSemester());
                if (ca.getClassName() != null) assignedClasses.add(ca.getClassName());
            }

            map.put("assignedYears", new ArrayList<>(assignedYears));
            map.put("assignedSems", new ArrayList<>(assignedSems));
            map.put("assignedClasses", new ArrayList<>(assignedClasses));
            map.put("assignedSubjects", new ArrayList<>(assignedSubjects));

            List<com.acronexus.dto.TeachingHistoryDTO> history = attendanceSessionService.getTeachingHistory(user.getId());
            long totalScheduled = 0;
            long conducted = 0;
            long missed = 0;
            if (history != null) {
                for (com.acronexus.dto.TeachingHistoryDTO h : history) {
                    totalScheduled += h.getTotalScheduled();
                    conducted += h.getConducted();
                    missed += h.getMissed();
                }
            }
            
            long absent = facultyActivityRepository.countDaysAbsentByFacultyId(user.getId());
            
            long holidays = 0;
            List<com.acronexus.entity.FacultyActivity> activities = facultyActivityRepository.findByFacultyIdOrderByDateDesc(user.getId());
            if (activities != null) {
                holidays = activities.stream().filter(a -> com.acronexus.entity.FacultyActivityStatus.HOLIDAY.equals(a.getStatus())).count();
            }

            int teachingAttendance = totalScheduled > 0 ? Math.round(((float) conducted / totalScheduled) * 100) : 0;
            String status = teachingAttendance > 75 ? "Active" : "Inactive";
            
            map.put("totalScheduled", totalScheduled);
            map.put("classesTaken", conducted);
            map.put("classesMissed", missed);
            map.put("absent", absent);
            map.put("holidays", holidays);
            map.put("teachingAttendance", teachingAttendance);
            map.put("status", status);

            response.add(map);
        }

        return ResponseEntity.ok(response);
    }
}
