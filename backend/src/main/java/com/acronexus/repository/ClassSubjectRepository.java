package com.acronexus.repository;

import com.acronexus.entity.ClassSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassSubjectRepository extends JpaRepository<ClassSubject, UUID> {
    java.util.Optional<ClassSubject> findByAcademicYearIdAndSemesterIdAndAcroClassIdAndSubjectIdAndFacultyIdAndIsActiveTrue(
            UUID academicYearId, UUID semesterId, UUID classId, UUID subjectId, UUID facultyId);
    boolean existsBySubjectIdAndFacultyIdAndIsActiveTrue(UUID subjectId, UUID facultyId);

    long countByFacultyIdAndIsActiveTrue(UUID facultyId);

    @Query("SELECT COUNT(DISTINCT cs.acroClass.id) FROM ClassSubject cs WHERE cs.faculty.id = :facultyId AND cs.isActive = true")
    long countDistinctClassesByFacultyId(@Param("facultyId") UUID facultyId);

    List<ClassSubject> findByFacultyIdAndIsActiveTrue(UUID facultyId);
    List<ClassSubject> findByFacultyId(UUID facultyId);
    
    List<ClassSubject> findByAcroClassIdAndIsActiveTrue(UUID classId);
}
