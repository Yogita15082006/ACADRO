package com.acronexus.repository;

import com.acronexus.entity.ExamCoordinatorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamCoordinatorAssignmentRepository extends JpaRepository<ExamCoordinatorAssignment, UUID> {
    
    @Query("SELECT e FROM ExamCoordinatorAssignment e " +
           "WHERE e.department.id = :departmentId " +
           "ORDER BY e.createdAt DESC")
    List<ExamCoordinatorAssignment> findAllByDepartmentId(@Param("departmentId") UUID departmentId);

    @Query("SELECT e FROM ExamCoordinatorAssignment e " +
           "WHERE e.department.id IN :departmentIds " +
           "ORDER BY e.createdAt DESC")
    List<ExamCoordinatorAssignment> findAllByDepartmentIdIn(@Param("departmentIds") List<UUID> departmentIds);
    
    @Query("SELECT e FROM ExamCoordinatorAssignment e " +
           "WHERE e.assignedUser.id = :userId " +
           "AND e.isActive = true " +
           "AND e.validUntil >= CURRENT_DATE")
    List<ExamCoordinatorAssignment> findActiveAssignmentsForUser(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(e) > 0 FROM ExamCoordinatorAssignment e " +
           "WHERE e.assignedUser.id = :userId " +
           "AND e.isActive = true " +
           "AND e.validUntil >= CURRENT_DATE")
    boolean hasActiveAssignment(@Param("userId") UUID userId);
}
