package com.acronexus.repository;

import com.acronexus.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, java.util.UUID> {
    Optional<Subject> findByCode(String code);
    java.util.List<Subject> findByIsActiveTrue();
}
