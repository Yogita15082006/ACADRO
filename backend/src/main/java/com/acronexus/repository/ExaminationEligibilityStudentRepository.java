package com.acronexus.repository;

import com.acronexus.entity.ExaminationEligibilityStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExaminationEligibilityStudentRepository extends JpaRepository<ExaminationEligibilityStudent, UUID> {
    void deleteByStudentId(UUID studentId);
}
