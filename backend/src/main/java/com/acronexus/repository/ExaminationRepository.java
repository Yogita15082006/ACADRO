package com.acronexus.repository;

import com.acronexus.entity.Examination;
import com.acronexus.entity.ExamType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

@Repository
public interface ExaminationRepository extends JpaRepository<Examination, UUID> {
    
    @EntityGraph(attributePaths = {"department", "semester"})
    Optional<Examination> findByIdAndIsDeletedFalse(UUID id);

    @EntityGraph(attributePaths = {"department", "semester"})
    List<Examination> findAllByIsDeletedFalse();

    boolean existsByDepartmentIdAndSemesterIdAndTypeAndIsDeletedFalse(UUID departmentId, UUID semesterId, ExamType type);
    
    boolean existsByDepartmentIdAndSemesterIdAndTypeAndIsDeletedFalseAndIdNot(UUID departmentId, UUID semesterId, ExamType type, UUID id);
    
    Optional<Examination> findByDepartmentIdAndSemesterIdAndType(UUID departmentId, UUID semesterId, ExamType type);

    long countByIsDeletedFalse();
    long countByDepartmentIdAndIsDeletedFalse(UUID departmentId);

}
