package com.acronexus.repository;

import com.acronexus.entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, java.util.UUID> {
    Optional<StudentEnrollment> findByStudentIdAndAcademicYearIdAndSemesterId(
            java.util.UUID studentId, java.util.UUID academicYearId, java.util.UUID semesterId);

    boolean existsByStudentIdAndAcroClassIdAndIsActiveTrue(java.util.UUID studentId, java.util.UUID classId);

    java.util.List<StudentEnrollment> findByAcroClassIdAndIsActiveTrue(java.util.UUID classId);
    
    Optional<StudentEnrollment> findFirstByStudentUserIdAndIsActiveTrueOrderByCreatedAtDesc(java.util.UUID studentId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.acroClass.name FROM StudentEnrollment e WHERE e.isActive = true AND e.acroClass IS NOT NULL ORDER BY e.acroClass.name")
    java.util.List<String> findDistinctActiveClasses();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.acroClass FROM StudentEnrollment e WHERE e.isActive = true AND e.acroClass IS NOT NULL")
    java.util.List<com.acronexus.entity.AcroClass> findDistinctActiveAcroClasses();
}
