package com.acronexus.repository;

import com.acronexus.entity.ProfessionalDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface ProfessionalDetailRepository extends JpaRepository<ProfessionalDetail, UUID> {
    Optional<ProfessionalDetail> findByFacultyId(UUID facultyId);
}
