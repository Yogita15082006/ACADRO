package com.acronexus.repository;

import com.acronexus.entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, java.util.UUID> {
    Optional<StudentEnrollment> findFirstByStudentIdAndAcademicYearIdAndSemesterIdOrderByIdDesc(
            java.util.UUID studentId, java.util.UUID academicYearId, java.util.UUID semesterId);

    boolean existsByStudentIdAndAcroClassIdAndIsActiveTrue(java.util.UUID studentId, java.util.UUID classId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT e.student.id) FROM StudentEnrollment e WHERE e.isActive = true AND e.acroClass.department.id = :departmentId")
    long countDistinctActiveStudentsByDepartmentId(@org.springframework.data.repository.query.Param("departmentId") java.util.UUID departmentId);

    java.util.List<StudentEnrollment> findByAcroClassIdAndIsActiveTrue(java.util.UUID classId);
    
    Optional<StudentEnrollment> findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(java.util.UUID studentUserId);
    
    Optional<StudentEnrollment> findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(java.util.UUID studentId);

    java.util.List<StudentEnrollment> findByStudentId(java.util.UUID studentId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM StudentEnrollment e " +
           "WHERE e.isActive = true " +
           "AND e.acroClass.department.id = :departmentId " +
           "AND e.student.batchYear = :batch " +
           "AND (e.academicYear.year = :academicYear OR e.academicYear.year LIKE CONCAT('%', :academicYear, '%')) " +
           "AND (CONCAT('Semester ', e.semester.semesterNumber) = :semester OR CAST(e.semester.semesterNumber as string) = :semester) " +
           "AND (e.acroClass.name = :className OR e.acroClass.section = :className OR CONCAT(e.acroClass.name, '-', e.acroClass.section) = :className OR CONCAT(e.acroClass.name, ' ', e.acroClass.section) = :className)")
    java.util.List<StudentEnrollment> findByStrictCoordinatorScope(
        @org.springframework.data.repository.query.Param("departmentId") java.util.UUID departmentId,
        @org.springframework.data.repository.query.Param("batch") String batch,
        @org.springframework.data.repository.query.Param("academicYear") String academicYear,
        @org.springframework.data.repository.query.Param("semester") String semester,
        @org.springframework.data.repository.query.Param("className") String className
    );

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.acroClass.name FROM StudentEnrollment e WHERE e.isActive = true AND e.acroClass IS NOT NULL ORDER BY e.acroClass.name")
    java.util.List<String> findDistinctActiveClasses();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.acroClass FROM StudentEnrollment e WHERE e.isActive = true AND e.acroClass IS NOT NULL")
    java.util.List<com.acronexus.entity.AcroClass> findDistinctActiveAcroClasses();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.academicYear.year FROM StudentEnrollment e WHERE e.student.batchYear = :batchYear AND e.isActive = true")
    java.util.List<String> findDistinctAcademicYearsByBatch(@org.springframework.data.repository.query.Param("batchYear") String batchYear);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT CAST(e.semester.semesterNumber AS string) FROM StudentEnrollment e WHERE e.student.batchYear = :batchYear AND e.academicYear.year IN :academicYears AND e.isActive = true")
    java.util.List<String> findDistinctSemesters(@org.springframework.data.repository.query.Param("batchYear") String batchYear, @org.springframework.data.repository.query.Param("academicYears") java.util.List<String> academicYears);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.acroClass FROM StudentEnrollment e WHERE e.student.batchYear = :batchYear AND e.academicYear.year IN :academicYears AND CAST(e.semester.semesterNumber AS string) = :semester AND e.acroClass.isActive = true AND e.acroClass.isDeleted = false")
    java.util.List<com.acronexus.entity.AcroClass> findClasses(@org.springframework.data.repository.query.Param("batchYear") String batchYear, @org.springframework.data.repository.query.Param("academicYears") java.util.List<String> academicYears, @org.springframework.data.repository.query.Param("semester") String semester);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM StudentEnrollment e JOIN Examination ex ON ex.id = :examinationId JOIN ex.classes c WHERE e.acroClass = c AND e.student.batchYear = ex.batch AND e.isActive = true ORDER BY e.acroClass.name, e.student.user.firstName")
    java.util.List<StudentEnrollment> findByExaminationId(@org.springframework.data.repository.query.Param("examinationId") java.util.UUID examinationId);
}
