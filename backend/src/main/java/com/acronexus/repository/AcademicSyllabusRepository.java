package com.acronexus.repository;

import com.acronexus.entity.AcademicSyllabus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface AcademicSyllabusRepository extends JpaRepository<AcademicSyllabus, UUID> {
    Optional<AcademicSyllabus> findByFileStorageId(UUID fileStorageId);
    long countByDepartmentIgnoreCase(String department);
}
