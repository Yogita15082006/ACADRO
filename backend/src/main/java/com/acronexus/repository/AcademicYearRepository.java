package com.acronexus.repository;

import com.acronexus.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, java.util.UUID> {
    Optional<AcademicYear> findByYear(String year);
    java.util.List<AcademicYear> findByIsActiveTrue();
}
