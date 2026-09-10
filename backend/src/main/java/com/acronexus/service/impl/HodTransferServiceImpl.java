package com.acronexus.service.impl;

import com.acronexus.entity.Department;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.CoordinatorAssignmentRepository;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.service.HodTransferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HodTransferServiceImpl implements HodTransferService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final com.acronexus.repository.FacultyRepository facultyRepository;

    @Override
    @Transactional
    public void assignHod(UUID targetUserId, List<UUID> selectedDeptIds) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        List<Department> currentlyManaged = departmentRepository.findByHodId(targetUserId);
        Set<UUID> currentlyManagedIds = currentlyManaged.stream().map(Department::getId).collect(Collectors.toSet());
        Set<UUID> newSelectedIds = new HashSet<>(selectedDeptIds);

        // HOD Membership Validation: verify targetUser legitimately belongs to the selected departments
        com.acronexus.entity.Faculty faculty = facultyRepository.findById(targetUserId).orElse(null);
        Set<UUID> normalMembershipIds = new HashSet<>();
        if (targetUser.getDepartment() != null) {
            normalMembershipIds.add(targetUser.getDepartment().getId());
        }
        if (faculty != null && faculty.getDepartments() != null) {
            faculty.getDepartments().forEach(d -> normalMembershipIds.add(d.getId()));
        }

        for (UUID newId : newSelectedIds) {
            if (!normalMembershipIds.contains(newId)) {
                throw new RuntimeException("Validation Failed: User must be a member of the department before they can be assigned as its HOD.");
            }
        }

        Set<User> displacedHods = new HashSet<>();

        // 1. Remove HOD ownership from deselected departments
        for (Department dept : currentlyManaged) {
            if (!newSelectedIds.contains(dept.getId())) {
                // Ensure we only clear it if this user is still the current HOD
                if (dept.getHod() != null && dept.getHod().getId().equals(targetUserId)) {
                    log.info("Removing HOD ownership of department {} from user {}", dept.getName(), targetUser.getEmail());
                    dept.setHod(null);
                    departmentRepository.save(dept);
                }
            }
        }

        // 2. Add HOD ownership to newly selected departments
        for (UUID deptId : newSelectedIds) {
            if (!currentlyManagedIds.contains(deptId)) {
                Department dept = departmentRepository.findById(deptId)
                        .orElseThrow(() -> new RuntimeException("Department not found: " + deptId));
                
                if (dept.getHod() != null && !dept.getHod().getId().equals(targetUserId)) {
                    displacedHods.add(dept.getHod());
                    log.info("Displacing previous HOD {} from department {}", dept.getHod().getEmail(), dept.getName());
                }

                log.info("Assigning HOD ownership of department {} to user {}", dept.getName(), targetUser.getEmail());
                dept.setHod(targetUser);
                departmentRepository.save(dept);
            }
        }

        // Flush to DB so existsByHodId works correctly for recalculation
        departmentRepository.flush();

        // 3. Recalculate target user's role
        recalculateRole(targetUser);

        // 4. Recalculate displaced HODs' roles
        for (User displacedUser : displacedHods) {
            recalculateRole(displacedUser);
        }
    }

    private void recalculateRole(User user) {
        UserRole originalRole = user.getRole();
        UserRole newRole;

        if (departmentRepository.existsByHodId(user.getId())) {
            newRole = UserRole.HOD;
        } else if (coordinatorAssignmentRepository.existsByCoordinatorId(user.getId())) {
            newRole = UserRole.COORDINATOR;
        } else {
            newRole = UserRole.FACULTY; // Base role fallback
        }

        if (originalRole != newRole) {
            log.info("Recalculating role for user {}: {} -> {}", user.getEmail(), originalRole, newRole);
            user.setRole(newRole);
            userRepository.save(user);
        }
    }
}
