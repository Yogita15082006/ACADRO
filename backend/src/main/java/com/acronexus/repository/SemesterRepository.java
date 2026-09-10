package com.acronexus.repository;

import com.acronexus.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, java.util.UUID> {
    Optional<Semester> findBySemesterNumberAndAcademicYearId(Integer semesterNumber, java.util.UUID academicYearId);
    java.util.List<Semester> findByIsActiveTrue();
}
