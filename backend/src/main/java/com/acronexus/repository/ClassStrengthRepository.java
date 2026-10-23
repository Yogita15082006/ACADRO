package com.acronexus.repository;

import com.acronexus.entity.ClassStrength;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassStrengthRepository extends JpaRepository<ClassStrength, UUID> {
    List<ClassStrength> findByDepartmentId(UUID departmentId);
    Optional<ClassStrength> findByAcroClassIdAndSemesterIdAndAcademicYearId(UUID classId, UUID semesterId, UUID academicYearId);
    Optional<ClassStrength> findByAcroClassId(UUID classId);
    List<ClassStrength> findByAcroClassIdIn(List<UUID> classIds);
}
