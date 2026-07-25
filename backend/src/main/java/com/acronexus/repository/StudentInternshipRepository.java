package com.acronexus.repository;

import com.acronexus.entity.StudentInternship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentInternshipRepository extends JpaRepository<StudentInternship, UUID> {
    List<StudentInternship> findByStudentId(UUID studentId);
}
