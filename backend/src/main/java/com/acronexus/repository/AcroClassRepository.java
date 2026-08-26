package com.acronexus.repository;

import com.acronexus.entity.AcroClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcroClassRepository extends JpaRepository<AcroClass, java.util.UUID> {
    Optional<AcroClass> findByNameIgnoreCaseAndSectionIgnoreCase(String name, String section);
    java.util.List<AcroClass> findByName(String name);
    long countByDepartmentId(java.util.UUID departmentId);
    java.util.List<AcroClass> findByDepartmentId(java.util.UUID departmentId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c FROM AcroClass c WHERE c.isActive = true AND c.isDeleted = false AND " +
           "(EXISTS (SELECT 1 FROM StudentEnrollment e WHERE e.acroClass = c AND e.semester.id = :semesterId AND e.isActive = true) OR " +
           "EXISTS (SELECT 1 FROM ClassSubject cs WHERE cs.acroClass = c AND cs.semester.id = :semesterId AND cs.isActive = true))")
    java.util.List<AcroClass> findValidClassesForSemester(@org.springframework.data.repository.query.Param("semesterId") java.util.UUID semesterId);
}
