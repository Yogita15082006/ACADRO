package com.acronexus.repository;

import com.acronexus.entity.FacultyResearchContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FacultyResearchContributionRepository extends JpaRepository<FacultyResearchContribution, UUID> {
    List<FacultyResearchContribution> findByFacultyIdOrderByCreatedAtDesc(UUID facultyId);
    List<FacultyResearchContribution> findByFacultyIdAndCategoryOrderByCreatedAtDesc(UUID facultyId, String category);
}
