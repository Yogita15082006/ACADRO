package com.acronexus.service.impl;

import com.acronexus.dto.response.StudentAcademicHistoryResponseDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.StudentAcademicHistoryService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAcademicHistoryServiceImpl implements StudentAcademicHistoryService {

    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;

    @Override
    public List<StudentAcademicHistoryResponseDto> getFilteredHistory(UUID academicYearId, UUID classId, String section, UUID semesterId, String status, String search) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        Department department = currentUser.getDepartment();
        UUID deptId = department != null ? department.getId() : null;
        UUID userId = currentUser.getId();

        StringBuilder jpql = new StringBuilder(
            "SELECT e FROM StudentEnrollment e " +
            "JOIN FETCH e.student s " +
            "LEFT JOIN FETCH s.degreeProgram " +
            "LEFT JOIN FETCH s.user u " +
            "LEFT JOIN FETCH e.academicYear ay " +
            "LEFT JOIN FETCH e.acroClass c " +
            "LEFT JOIN FETCH e.semester sem " +
            "WHERE ((:deptId IS NOT NULL AND (c.department.id = :deptId OR u.department.id = :deptId)) " +
            "   OR c.department.hod.id = :userId OR u.department.hod.id = :userId) "
        );

        if (academicYearId != null) {
            jpql.append("AND ay.id = :academicYearId ");
        }
        if (classId != null) {
            jpql.append("AND c.id = :classId ");
        }
        if (section != null && !section.trim().isEmpty()) {
            jpql.append("AND c.section = :section ");
        }
        if (semesterId != null) {
            jpql.append("AND sem.id = :semesterId ");
        }
        if (search != null && !search.trim().isEmpty()) {
            jpql.append("AND (LOWER(s.enrollmentNo) LIKE :search OR LOWER(u.firstName) LIKE :search OR LOWER(u.lastName) LIKE :search) ");
        }

        jpql.append("ORDER BY ay.year DESC, s.enrollmentNo ASC");

        var query = entityManager.createQuery(jpql.toString(), StudentEnrollment.class);
        query.setParameter("deptId", deptId);
        query.setParameter("userId", userId);

        if (academicYearId != null) query.setParameter("academicYearId", academicYearId);
        if (classId != null) query.setParameter("classId", classId);
        if (section != null && !section.trim().isEmpty()) query.setParameter("section", section.trim());
        if (semesterId != null) query.setParameter("semesterId", semesterId);
        if (search != null && !search.trim().isEmpty()) query.setParameter("search", "%" + search.trim().toLowerCase() + "%");

        List<StudentEnrollment> enrollments = query.getResultList();

        List<StudentAcademicHistoryResponseDto> result = processEnrollments(enrollments, status);

        // Include students currently enrolled in the institution who do not yet have historical records
        if (academicYearId == null && classId == null && (section == null || section.trim().isEmpty()) && semesterId == null) {
            StringBuilder stdJpql = new StringBuilder(
                "SELECT s FROM Student s " +
                "LEFT JOIN FETCH s.degreeProgram " +
                "LEFT JOIN FETCH s.user u " +
                "WHERE ((:deptId IS NOT NULL AND u.department.id = :deptId) OR u.department.hod.id = :userId) " +
                "AND NOT EXISTS (SELECT 1 FROM StudentEnrollment se WHERE se.student = s) "
            );
            if (search != null && !search.trim().isEmpty()) {
                stdJpql.append("AND (LOWER(s.enrollmentNo) LIKE :search OR LOWER(u.firstName) LIKE :search OR LOWER(u.lastName) LIKE :search) ");
            }
            stdJpql.append("ORDER BY s.enrollmentNo ASC");

            var stdQuery = entityManager.createQuery(stdJpql.toString(), Student.class);
            stdQuery.setParameter("deptId", deptId);
            stdQuery.setParameter("userId", userId);
            if (search != null && !search.trim().isEmpty()) {
                stdQuery.setParameter("search", "%" + search.trim().toLowerCase() + "%");
            }

            List<Student> studentsWithoutEnrollment = stdQuery.getResultList();
            for (Student s : studentsWithoutEnrollment) {
                StudentAcademicHistoryResponseDto dto = mapStudentWithoutEnrollment(s, status);
                if (dto != null) {
                    result.add(dto);
                }
            }
        }

        return result;
    }

    @Override
    public List<StudentAcademicHistoryResponseDto> getStudentHistory(UUID studentId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        Department department = currentUser.getDepartment();
        UUID deptId = department != null ? department.getId() : null;
        UUID userId = currentUser.getId();

        String jpql = "SELECT e FROM StudentEnrollment e " +
            "JOIN FETCH e.student s " +
            "LEFT JOIN FETCH s.degreeProgram " +
            "LEFT JOIN FETCH s.user u " +
            "LEFT JOIN FETCH e.academicYear ay " +
            "LEFT JOIN FETCH e.acroClass c " +
            "LEFT JOIN FETCH e.semester sem " +
            "WHERE ((:deptId IS NOT NULL AND (c.department.id = :deptId OR u.department.id = :deptId)) " +
            "   OR c.department.hod.id = :userId OR u.department.hod.id = :userId) " +
            "AND s.id = :studentId " +
            "ORDER BY ay.year DESC, sem.semesterNumber DESC";

        var query = entityManager.createQuery(jpql, StudentEnrollment.class);
        query.setParameter("deptId", deptId);
        query.setParameter("userId", userId);
        query.setParameter("studentId", studentId);

        List<StudentEnrollment> enrollments = query.getResultList();

        List<StudentAcademicHistoryResponseDto> result = processEnrollments(enrollments, null);

        if (result.isEmpty()) {
            String stdJpql = "SELECT s FROM Student s " +
                "LEFT JOIN FETCH s.degreeProgram " +
                "LEFT JOIN FETCH s.user u " +
                "WHERE ((:deptId IS NOT NULL AND u.department.id = :deptId) OR u.department.hod.id = :userId) " +
                "AND s.id = :studentId";
            var stdQuery = entityManager.createQuery(stdJpql, Student.class);
            stdQuery.setParameter("deptId", deptId);
            stdQuery.setParameter("userId", userId);
            stdQuery.setParameter("studentId", studentId);
            List<Student> stdList = stdQuery.getResultList();
            if (!stdList.isEmpty()) {
                StudentAcademicHistoryResponseDto dto = mapStudentWithoutEnrollment(stdList.get(0), null);
                if (dto != null) {
                    result.add(dto);
                }
            }
        }

        return result;
    }

    private List<StudentAcademicHistoryResponseDto> processEnrollments(List<StudentEnrollment> enrollments, String statusFilter) {
        List<StudentAcademicHistoryResponseDto> result = new ArrayList<>();
        int currentYearNum = LocalDate.now().getYear();

        for (StudentEnrollment e : enrollments) {
            Student s = e.getStudent();
            User u = s != null ? s.getUser() : null;
            int gradYear = calculateGraduationYear(s);
            int retentionEndYear = gradYear + 3;
            
            int enrollmentAcYearStart = 0;
            if (e.getAcademicYear() != null && e.getAcademicYear().getStartDate() != null) {
                enrollmentAcYearStart = e.getAcademicYear().getStartDate().getYear();
            } else if (e.getAcademicYear() != null && e.getAcademicYear().getYear() != null) {
                try {
                    enrollmentAcYearStart = Integer.parseInt(e.getAcademicYear().getYear().split("-")[0].trim());
                } catch (Exception ex) {
                    enrollmentAcYearStart = 0;
                }
            }

            // Retention Rule: Must not exceed GradYear + 3
            if (enrollmentAcYearStart > 1900 && retentionEndYear > 0 && enrollmentAcYearStart > retentionEndYear) {
                continue;
            }

            boolean isPassedOut = isStudentPassedOut(s, e, currentYearNum);
            String calculatedStatus = isPassedOut ? "Passed Out" : "Current Student";

            // If a specific status filter is applied
            if (statusFilter != null && !statusFilter.trim().isEmpty()) {
                String filter = statusFilter.trim().toLowerCase();
                if (filter.contains("current") && isPassedOut) {
                    continue;
                }
                if (filter.contains("pass") && !isPassedOut) {
                    continue;
                }
            }

            // Fetch Attendance
            Double attendancePercentage = null;
            if (e.getAcademicYear() != null && e.getSemester() != null && s != null) {
                try {
                    Object attResult = studentAttendanceRepository.getOverallAttendance(s.getId(), e.getAcademicYear().getId(), e.getSemester().getId());
                    if (attResult != null && attResult instanceof Object[]) {
                        Object[] row = (Object[]) attResult;
                        Long totalClasses = (Long) row[2];
                        Long totalPresent = (Long) row[3];
                        if (totalClasses != null && totalClasses > 0) {
                            attendancePercentage = Math.round(((totalPresent != null ? totalPresent : 0) * 100.0 / totalClasses) * 100.0) / 100.0;
                        }
                    }
                } catch (Exception ex) {
                    log.error("Failed to calculate attendance for student {}", s.getId(), ex);
                }
            }

            // Fetch Mid Term Marks
            Double midTermMarks = null;
            if (e.getSemester() != null && s != null) {
                try {
                    String midTermQuery = "SELECT SUM(er.marksObtained) FROM ExamResult er " +
                        "WHERE er.student.id = :studentId " +
                        "AND er.examination.semester.id = :semesterId " +
                        "AND er.examination.type = :examType";
                    var q = entityManager.createQuery(midTermQuery, java.math.BigDecimal.class);
                    q.setParameter("studentId", s.getId());
                    q.setParameter("semesterId", e.getSemester().getId());
                    q.setParameter("examType", com.acronexus.entity.ExamType.MID_TERM);
                    java.math.BigDecimal totalMidTerm = q.getSingleResult();
                    if (totalMidTerm != null) {
                        midTermMarks = totalMidTerm.doubleValue();
                    }
                } catch (Exception ex) {
                    log.error("Failed to fetch mid term marks for student {}", s.getId(), ex);
                }
            }

            // Fetch SGPA
            Double sgpaVal = null;
            if (e.getSgpa() != null) {
                sgpaVal = e.getSgpa().doubleValue();
            } else if (e.getSemester() != null && e.getSemester().getSemesterNumber() != null && s != null) {
                int semNum = e.getSemester().getSemesterNumber();
                java.math.BigDecimal sgpaBd = null;
                switch(semNum) {
                    case 1: sgpaBd = s.getSgpaSem1(); break;
                    case 2: sgpaBd = s.getSgpaSem2(); break;
                    case 3: sgpaBd = s.getSgpaSem3(); break;
                    case 4: sgpaBd = s.getSgpaSem4(); break;
                    case 5: sgpaBd = s.getSgpaSem5(); break;
                    case 6: sgpaBd = s.getSgpaSem6(); break;
                    case 7: sgpaBd = s.getSgpaSem7(); break;
                    case 8: sgpaBd = s.getSgpaSem8(); break;
                }
                if (sgpaBd != null) {
                    sgpaVal = sgpaBd.doubleValue();
                }
            }

            // Fetch CGPA
            Double cgpaVal = null;
            if (e.getCgpa() != null) {
                cgpaVal = e.getCgpa().doubleValue();
            } else if (s != null && s.getCgpa() != null) {
                cgpaVal = s.getCgpa().doubleValue();
            }

            StudentAcademicHistoryResponseDto dto = StudentAcademicHistoryResponseDto.builder()
                    .enrollmentId(e.getId())
                    .studentId(s != null ? s.getId() : null)
                    .enrollmentNo(s != null ? s.getEnrollmentNo() : "N/A")
                    .studentName(u != null ? (u.getFirstName() + (u.getLastName() != null ? " " + u.getLastName() : "")).trim() : "N/A")
                    .batchYear(s != null ? s.getBatchYear() : null)
                    .admissionYear(s != null ? s.getAdmissionYear() : null)
                    .academicYearId(e.getAcademicYear() != null ? e.getAcademicYear().getId() : null)
                    .academicYear(e.getAcademicYear() != null ? e.getAcademicYear().getYear() : null)
                    .classId(e.getAcroClass() != null ? e.getAcroClass().getId() : null)
                    .className(e.getAcroClass() != null ? e.getAcroClass().getName() : (s != null ? s.getCourse() : null))
                    .section(e.getAcroClass() != null ? e.getAcroClass().getSection() : (s != null ? s.getSection() : null))
                    .semesterId(e.getSemester() != null ? e.getSemester().getId() : null)
                    .semesterNumber(e.getSemester() != null ? e.getSemester().getSemesterNumber() : null)
                    .attendancePercentage(attendancePercentage)
                    .midTermMarks(midTermMarks)
                    .sgpa(sgpaVal)
                    .cgpa(cgpaVal)
                    .status(calculatedStatus)
                    .build();

            result.add(dto);
        }

        return result;
    }

    private StudentAcademicHistoryResponseDto mapStudentWithoutEnrollment(Student s, String statusFilter) {
        if (s == null) return null;
        int currentYearNum = LocalDate.now().getYear();
        User u = s.getUser();
        int gradYear = calculateGraduationYear(s);
        boolean isPassedOut = isStudentPassedOut(s, null, currentYearNum);
        String calculatedStatus = isPassedOut ? "Passed Out" : "Current Student";

        if (statusFilter != null && !statusFilter.trim().isEmpty()) {
            String filter = statusFilter.trim().toLowerCase();
            if (filter.contains("current") && isPassedOut) {
                return null;
            }
            if (filter.contains("pass") && !isPassedOut) {
                return null;
            }
        }

        Integer semNum = null;
        if (s.getCurrentSemester() != null) {
            try {
                semNum = Integer.parseInt(s.getCurrentSemester().replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {}
        }
        Double cgpaVal = null;
        if (s.getCgpa() != null) {
            cgpaVal = s.getCgpa().doubleValue();
        }

        return StudentAcademicHistoryResponseDto.builder()
                .enrollmentId(null)
                .studentId(s.getId())
                .enrollmentNo(s.getEnrollmentNo())
                .studentName(u != null ? (u.getFirstName() + (u.getLastName() != null ? " " + u.getLastName() : "")).trim() : "N/A")
                .batchYear(s.getBatchYear())
                .admissionYear(s.getAdmissionYear())
                .academicYearId(null)
                .academicYear(null)
                .classId(null)
                .className(s.getCourse())
                .section(s.getSection())
                .semesterId(null)
                .semesterNumber(semNum)
                .attendancePercentage(null)
                .midTermMarks(null)
                .sgpa(null)
                .cgpa(cgpaVal)
                .status(calculatedStatus)
                .build();
    }

    private boolean isStudentPassedOut(Student s, StudentEnrollment e, int currentYearNum) {
        if (s == null) return false;

        int duration = s.getDegreeProgram() != null && s.getDegreeProgram().getDurationYears() != null
                ? s.getDegreeProgram().getDurationYears() : 4;
        int totalSemesters = duration * 2;

        // If currently enrolled in a valid study semester (e.g. Sem 6 <= 8), the student is currently studying
        if (e != null && e.getSemester() != null && e.getSemester().getSemesterNumber() != null) {
            int semNum = e.getSemester().getSemesterNumber();
            if (semNum > 0 && semNum <= totalSemesters) {
                int gradYear = calculateGraduationYear(s);
                if (currentYearNum <= gradYear) {
                    return false;
                }
            }
        }

        // If the student's current semester indicates active study
        if (s.getCurrentSemester() != null) {
            try {
                int sem = Integer.parseInt(s.getCurrentSemester().replaceAll("[^0-9]", ""));
                if (sem > 0 && sem <= totalSemesters) {
                    int gradYear = calculateGraduationYear(s);
                    if (currentYearNum <= gradYear) {
                        return false;
                    }
                }
            } catch (Exception ignored) {}
        }

        int gradYear = calculateGraduationYear(s);
        return currentYearNum > gradYear;
    }

    private int calculateGraduationYear(Student s) {
        if (s == null) return LocalDate.now().getYear();
        int duration = s.getDegreeProgram() != null && s.getDegreeProgram().getDurationYears() != null
                ? s.getDegreeProgram().getDurationYears() : 4;
        String batch = s.getBatchYear();
        String adm = s.getAdmissionYear();

        if (batch != null && !batch.trim().isEmpty()) {
            Integer grad = parseGraduationYearFromString(batch.trim(), duration);
            if (grad != null) return grad;
        }

        if (adm != null && !adm.trim().isEmpty()) {
            Integer grad = parseGraduationYearFromString(adm.trim(), duration);
            if (grad != null) return grad;
        }

        if (s.getCurrentSemester() != null) {
            try {
                int sem = Integer.parseInt(s.getCurrentSemester().replaceAll("[^0-9]", ""));
                int currentStudyYear = (sem + 1) / 2;
                int remainingYears = Math.max(0, duration - currentStudyYear);
                return LocalDate.now().getYear() + remainingYears;
            } catch (Exception ignored) {}
        }

        return LocalDate.now().getYear();
    }

    private Integer parseGraduationYearFromString(String str, int duration) {
        if (str.contains("-")) {
            String[] parts = str.split("-");
            try {
                int start = Integer.parseInt(parts[0].trim());
                int end = Integer.parseInt(parts[1].trim());
                if (end < 100) {
                    end += 2000;
                }
                if (end - start >= 2) {
                    return end;
                } else {
                    return start + duration;
                }
            } catch (Exception ignored) {}
        } else {
            try {
                int start = Integer.parseInt(str.replaceAll("[^0-9]", ""));
                if (start >= 1900 && start <= 2100) {
                    return start + duration;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }
}
