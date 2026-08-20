package com.acronexus.repository;

import com.acronexus.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByEnrollmentNo(String enrollmentNo);
    Optional<Student> findByUser_Id(UUID userId);
    List<Student> findByBatchYear(String batchYear);
    List<Student> findByBatchYearAndUser_Department_Id(String batchYear, UUID departmentId);


    @Query("SELECT s FROM Student s LEFT JOIN s.user u WHERE " +
           "(:search IS NULL OR LOWER(s.enrollmentNo) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:batch IS NULL OR s.batchYear = :batch) AND " +
           "(:status IS NULL OR (:status = 'Active' AND u.isActive = true) OR (:status = 'Inactive' AND u.isActive = false)) AND " +
           "(:className IS NULL OR EXISTS (SELECT e FROM StudentEnrollment e JOIN e.acroClass c WHERE e.student = s AND e.isActive = true AND (c.section = :className OR c.name = :className OR CONCAT(c.name, '-', c.section) = :className)))")
    Page<Student> findAllWithFilters(
            @Param("search") String search,
            @Param("batch") String batch,
            @Param("status") String status,
            @Param("className") String className,
            Pageable pageable);

    @Query("SELECT DISTINCT s.batchYear FROM Student s WHERE s.batchYear IS NOT NULL ORDER BY s.batchYear DESC")
    List<String> findDistinctBatchYears();

    @Query("SELECT s FROM Student s LEFT JOIN s.user u WHERE " +
           "u.isActive = true AND " +
           "u.department.id = :departmentId AND " +
           "s.batchYear = :batch AND " +
           "(CONCAT('Semester ', s.currentSemester) = :semester OR CAST(s.currentSemester AS string) = :semester) AND " +
           "(s.section = :className OR s.course = :className OR CONCAT(s.course, '-', s.section) = :className OR CONCAT(s.course, ' ', s.section) = :className)")
    List<Student> findByStrictCoordinatorScope(
        @Param("departmentId") UUID departmentId,
        @Param("batch") String batch,
        @Param("semester") String semester,
        @Param("className") String className
    );
    
    @Query("SELECT s FROM Student s LEFT JOIN s.user u WHERE " +
           "u.isActive = true AND u.isDeleted = false AND " +
           "s.batchYear = :batch AND " +
           "(CONCAT('Semester ', s.currentSemester) = :semester OR CAST(s.currentSemester AS string) = :semester) AND " +
           "(s.section = :className OR s.course = :className OR CONCAT(s.course, '-', s.section) = :className OR CONCAT(s.course, ' ', s.section) = :className)")
    List<Student> findByExaminationClassScope(
        @Param("batch") String batch,
        @Param("semester") String semester,
        @Param("className") String className
    );
}
