package com.acronexus.service.impl;

import com.acronexus.entity.Department;
import com.acronexus.entity.Faculty;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * One-time idempotent legacy HOD compatibility backfill.
 * This runs on ApplicationReadyEvent.
 * It strictly guards against overwriting non-null Department.hod explicitly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HodMigrationService {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void runLegacyHodBackfill() {
        log.info("Starting one-time idempotent HOD compatibility backfill...");

        // Only process users who currently have role = HOD
        List<User> legacyHods = userRepository.findByRoleInAndIsDeletedFalse(List.of(UserRole.HOD));
        
        if (legacyHods.isEmpty()) {
            log.info("No legacy HOD users found. Skipping backfill.");
            return;
        }

        int departmentsUpdated = 0;

        for (User hodUser : legacyHods) {
            Set<Department> targetDepartments = new HashSet<>();

            // Add users.department_id
            if (hodUser.getDepartment() != null) {
                targetDepartments.add(hodUser.getDepartment());
            }

            // Add faculty_departments
            Faculty faculty = facultyRepository.findById(hodUser.getId()).orElse(null);
            if (faculty != null && faculty.getDepartments() != null) {
                targetDepartments.addAll(faculty.getDepartments());
            }

            for (Department dept : targetDepartments) {
                // Ensure we never overwrite a non-null explicit Department.hod
                if (dept.getHod() == null) {
                    log.info("Backfilling Department.hod for Department '{}' (ID: {}) to User '{}' (ID: {})", 
                            dept.getName(), dept.getId(), hodUser.getEmail(), hodUser.getId());
                    dept.setHod(hodUser);
                    departmentRepository.save(dept);
                    departmentsUpdated++;
                } else {
                    log.info("Department '{}' already has explicit HOD assigned. Skipping backfill for this department.", dept.getName());
                }
            }
        }

        log.info("HOD compatibility backfill completed. Departments explicitly assigned: {}", departmentsUpdated);
    }
}
