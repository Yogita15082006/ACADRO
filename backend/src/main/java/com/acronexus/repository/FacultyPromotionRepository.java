package com.acronexus.repository;

import com.acronexus.entity.FacultyPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FacultyPromotionRepository extends JpaRepository<FacultyPromotion, UUID> {
    List<FacultyPromotion> findByFacultyIdOrderByPromotionDateDesc(UUID facultyId);
}
