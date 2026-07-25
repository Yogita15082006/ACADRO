package com.acronexus.repository;

import com.acronexus.entity.AcademicScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface AcademicSchemeRepository extends JpaRepository<AcademicScheme, UUID> {
    Optional<AcademicScheme> findByFileStorageId(UUID fileStorageId);
}
