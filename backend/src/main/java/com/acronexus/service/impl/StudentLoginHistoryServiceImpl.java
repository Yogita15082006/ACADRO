package com.acronexus.service.impl;

import com.acronexus.entity.*;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.repository.*;
import com.acronexus.service.StudentLoginHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentLoginHistoryServiceImpl implements StudentLoginHistoryService {

    private final StudentLoginHistoryRepository loginHistoryRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final AcroClassRepository acroClassRepository;
    private final CoordinatorAssignmentRepository coordinatorAssignmentRepository;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;

    // ── Record login ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void recordLogin(UUID studentUserId) {
        User user = userRepository.findById(studentUserId).orElse(null);
        if (user == null || user.getRole() != UserRole.STUDENT) return;

        StudentLoginHistory record = new StudentLoginHistory();
        record.setStudent(user);
        record.setLoginTimestamp(Instant.now());
        loginHistoryRepository.save(record);
    }

    // ── Accessible classes ────────────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> getAccessibleClasses(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<AcroClass> classes;

        if (user.getRole() == UserRole.HOD) {
            classes = getHodClasses(userId);
        } else if (user.getRole() == UserRole.COORDINATOR) {
            classes = getCoordinatorClasses(userId);
        } else {
            throw new AccessDeniedException("Only HOD and Coordinator can access this module");
        }

        return classes.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("section", c.getSection());
            m.put("displayName", extractSectionLabel(c));
            return m;
        }).collect(Collectors.toList());
    }

    // ── Class login summary ───────────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> getClassLoginSummary(String classIdStr, UUID requesterId) {
        List<StudentEnrollment> enrollments;

        if ("ALL".equalsIgnoreCase(classIdStr)) {
            // Fetch all classes accessible to the requester
            List<Map<String, Object>> accessibleClasses = getAccessibleClasses(requesterId);
            List<UUID> classIds = accessibleClasses.stream()
                    .map(c -> (UUID) c.get("id"))
                    .collect(Collectors.toList());

            if (classIds.isEmpty()) {
                return Collections.emptyList();
            }

            enrollments = new ArrayList<>();
            for (UUID cid : classIds) {
                enrollments.addAll(studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(cid));
            }
        } else {
            UUID classId;
            try {
                classId = UUID.fromString(classIdStr);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid class ID format: " + classIdStr);
            }
            verifyClassAccess(classId, requesterId);
            enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classId);
        }

        if (enrollments.isEmpty()) {
            return Collections.emptyList();
        }

        // Sort enrollments by createdAt DESC to ensure we pick the latest active enrollment per user when deduplicating
        enrollments.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        List<UUID> userIds = enrollments.stream()
                .map(e -> e.getStudent().getUser().getId())
                .distinct()
                .collect(Collectors.toList());

        // Batch fetch latest logins and counts
        Map<UUID, Object> latestLogins = new HashMap<>();
        for (Object[] row : loginHistoryRepository.findLatestLoginByStudentIds(userIds)) {
            latestLogins.put((UUID) row[0], row[1]);
        }

        Map<UUID, Long> loginCounts = new HashMap<>();
        for (Object[] row : loginHistoryRepository.findLoginCountByStudentIds(userIds)) {
            loginCounts.put((UUID) row[0], (Long) row[1]);
        }

        // Do not deduplicate by User ID so students appearing in multiple classes are preserved
        List<Map<String, Object>> result = new ArrayList<>();
        ZoneId istZone = ZoneId.of("Asia/Kolkata");

        for (StudentEnrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            User sUser = student.getUser();
            UUID uid = sUser.getId();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("studentId", student.getId());
            row.put("userId", uid);
            row.put("studentName", (sUser.getFirstName() + " " + (sUser.getLastName() != null ? sUser.getLastName() : "")).trim());
            row.put("enrollmentNo", student.getEnrollmentNo());
            row.put("classId", enrollment.getAcroClass().getId());
            row.put("className", extractSectionLabel(enrollment.getAcroClass()));

            Object rawLogin = latestLogins.get(uid);
            Instant lastLogin = null;
            if (rawLogin instanceof Instant) {
                lastLogin = (Instant) rawLogin;
            } else if (rawLogin instanceof java.sql.Timestamp) {
                lastLogin = ((java.sql.Timestamp) rawLogin).toInstant();
            } else if (rawLogin instanceof java.time.LocalDateTime) {
                lastLogin = ((java.time.LocalDateTime) rawLogin).atZone(ZoneId.systemDefault()).toInstant();
            } else if (rawLogin != null) {
                try {
                    lastLogin = Instant.parse(rawLogin.toString());
                } catch (Exception e) {
                    // Fallback
                }
            }

            if (lastLogin != null) {
                row.put("lastLogin", lastLogin.atZone(istZone).format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")));
                row.put("lastLoginTimestamp", lastLogin.toString());
            } else {
                row.put("lastLogin", null);
                row.put("lastLoginTimestamp", null);
            }

            row.put("totalLogins", loginCounts.getOrDefault(uid, 0L));
            result.add(row);
        }

        // Sort by className (which preserves existing class order) then enrollmentNo
        result.sort(Comparator.comparing((Map<String, Object> r) -> (String) r.get("className"), Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(r -> (String) r.get("enrollmentNo"), Comparator.nullsLast(String::compareToIgnoreCase)));
        return result;
    }

    // ── Individual student login history ──────────────────────────────────────

    @Override
    public Map<String, Object> getStudentLoginHistory(UUID studentId, UUID requesterId) {
        // Verify the requester can see this student
        verifyStudentAccess(studentId, requesterId);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        User sUser = student.getUser();

        // Get section label from active enrollment
        String className = "N/A";
        Optional<StudentEnrollment> enrollment = studentEnrollmentRepository
                .findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(studentId);
        if (enrollment.isPresent() && enrollment.get().getAcroClass() != null) {
            className = extractSectionLabel(enrollment.get().getAcroClass());
        }

        List<StudentLoginHistory> history = loginHistoryRepository
                .findByStudentIdOrderByLoginTimestampDesc(studentId);

        List<Map<String, Object>> historyList = new ArrayList<>();
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd MMM yyyy").withZone(istZone);
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm:ss a").withZone(istZone);

        for (int i = 0; i < history.size(); i++) {
            StudentLoginHistory h = history.get(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("index", i + 1);
            entry.put("loginDate", dateFmt.format(h.getLoginTimestamp()));
            entry.put("loginTime", timeFmt.format(h.getLoginTimestamp()));
            entry.put("loginTimestamp", h.getLoginTimestamp().toString());
            historyList.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", studentId);
        result.put("studentName", (sUser.getFirstName() + " " + (sUser.getLastName() != null ? sUser.getLastName() : "")).trim());
        result.put("enrollmentNo", student.getEnrollmentNo());
        result.put("className", className);
        result.put("totalLogins", history.size());
        result.put("history", historyList);

        return result;
    }

    // ── Authorization helpers ─────────────────────────────────────────────────

    private void verifyClassAccess(UUID classId, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (requester.getRole() == UserRole.HOD) {
            List<AcroClass> allowed = getHodClasses(requesterId);
            boolean authorized = allowed.stream().anyMatch(c -> c.getId().equals(classId));
            if (!authorized) throw new AccessDeniedException("HOD is not authorized for this class");
        } else if (requester.getRole() == UserRole.COORDINATOR) {
            List<AcroClass> allowed = getCoordinatorClasses(requesterId);
            boolean authorized = allowed.stream().anyMatch(c -> c.getId().equals(classId));
            if (!authorized) throw new AccessDeniedException("Coordinator is not authorized for this class");
        } else {
            throw new AccessDeniedException("Only HOD and Coordinator can access this module");
        }
    }

    private void verifyStudentAccess(UUID studentId, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (requester.getRole() != UserRole.HOD && requester.getRole() != UserRole.COORDINATOR) {
            throw new AccessDeniedException("Only HOD and Coordinator can access this module");
        }

        // Find the student's active enrollment class
        Optional<StudentEnrollment> enrollment = studentEnrollmentRepository
                .findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(studentId);

        if (enrollment.isEmpty()) {
            // Student not enrolled – allow HOD (may be historical), deny coordinator
            if (requester.getRole() == UserRole.COORDINATOR) {
                throw new AccessDeniedException("Student not found in your assigned classes");
            }
            return; // HOD can still view
        }

        UUID classId = enrollment.get().getAcroClass().getId();
        verifyClassAccess(classId, requesterId);
    }

    // ── Class resolution helpers ──────────────────────────────────────────────

    private List<AcroClass> getHodClasses(UUID hodUserId) {
        // HOD can see classes in departments where they are the HOD,
        // AND classes in departments linked via faculty_departments
        Set<UUID> deptIds = new HashSet<>();

        // 1. Departments where this user is HOD
        List<Department> hodDepts = departmentRepository.findByHodId(hodUserId);
        for (Department d : hodDepts) {
            deptIds.add(d.getId());
        }

        // 2. Departments linked via faculty profile
        facultyRepository.findById(hodUserId).ifPresent(faculty -> {
            if (faculty.getDepartments() != null) {
                for (Department d : faculty.getDepartments()) {
                    deptIds.add(d.getId());
                }
            }
        });

        if (deptIds.isEmpty()) {
            // Fallback: user's own department
            User user = userRepository.findById(hodUserId).orElse(null);
            if (user != null && user.getDepartment() != null) {
                deptIds.add(user.getDepartment().getId());
            }
        }

        List<AcroClass> all = new ArrayList<>();
        for (UUID deptId : deptIds) {
            all.addAll(acroClassRepository.findByDepartmentId(deptId));
        }

        // Deduplicate and filter active
        return all.stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .filter(c -> c.getIsDeleted() == null || !c.getIsDeleted())
                .collect(Collectors.collectingAndThen(
                    Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(AcroClass::getName, Comparator.nullsLast(String::compareToIgnoreCase))
                            .thenComparing(AcroClass::getSection, Comparator.nullsLast(String::compareToIgnoreCase))
                            .thenComparing(AcroClass::getId))),
                    ArrayList::new
                ));
    }

    private List<AcroClass> getCoordinatorClasses(UUID coordinatorUserId) {
        List<CoordinatorAssignment> assignments = coordinatorAssignmentRepository
                .findByCoordinatorId(coordinatorUserId);

        // CoordinatorAssignment uses className (string) not AcroClass reference,
        // so we need to resolve the class names to AcroClass entities
        Set<String> classNames = assignments.stream()
                .filter(a -> a.getIsActive() != null && a.getIsActive())
                .map(CoordinatorAssignment::getClassName)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<AcroClass> result = new ArrayList<>();
        for (String cn : classNames) {
            result.addAll(acroClassRepository.findByNameOrSection(cn));
        }

        return result.stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .filter(c -> c.getIsDeleted() == null || !c.getIsDeleted())
                .collect(Collectors.collectingAndThen(
                    Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(AcroClass::getName, Comparator.nullsLast(String::compareToIgnoreCase))
                            .thenComparing(AcroClass::getSection, Comparator.nullsLast(String::compareToIgnoreCase))
                            .thenComparing(AcroClass::getId))),
                    ArrayList::new
                ));
    }

    private String extractSectionLabel(AcroClass c) {
        if (c.getSection() != null && !c.getSection().trim().isEmpty()) {
            return c.getSection().trim().replaceAll("\\s+", ""); // e.g., "IT 1" -> "IT1"
        }
        return c.getName() != null ? c.getName().trim().replaceAll("\\s+", "") : "Unknown";
    }

}
