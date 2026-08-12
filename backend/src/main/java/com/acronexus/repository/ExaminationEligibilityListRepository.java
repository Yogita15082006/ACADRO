package com.acronexus.repository;

import com.acronexus.entity.ExaminationEligibilityList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExaminationEligibilityListRepository extends JpaRepository<ExaminationEligibilityList, UUID> {
    java.util.List<ExaminationEligibilityList> findByExaminationIdOrderByCreatedAtDesc(UUID examinationId);
    void deleteByExaminationId(UUID examinationId);
}
