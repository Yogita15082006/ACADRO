package com.acronexus.repository;

import com.acronexus.entity.StudentCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentCertificationRepository extends JpaRepository<StudentCertification, UUID> {
    List<StudentCertification> findByStudentId(UUID studentId);
}
