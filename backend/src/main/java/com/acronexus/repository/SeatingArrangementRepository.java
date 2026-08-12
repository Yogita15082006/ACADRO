package com.acronexus.repository;

import com.acronexus.entity.SeatingArrangement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeatingArrangementRepository extends JpaRepository<SeatingArrangement, UUID> {
    Optional<SeatingArrangement> findByExaminationIdAndIsDeletedFalse(UUID examinationId);
}
