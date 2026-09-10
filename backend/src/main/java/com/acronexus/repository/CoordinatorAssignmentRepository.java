package com.acronexus.repository;

import com.acronexus.entity.CoordinatorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CoordinatorAssignmentRepository extends JpaRepository<CoordinatorAssignment, UUID> {
    java.util.List<CoordinatorAssignment> findByCoordinatorId(UUID coordinatorId);
    java.util.List<CoordinatorAssignment> findByCoordinatorIdIn(java.util.List<UUID> coordinatorIds);
    
    java.util.List<CoordinatorAssignment> findByClassNameAndIsActiveTrue(String className);
    java.util.List<CoordinatorAssignment> findByClassName(String className);
    boolean existsByCoordinatorId(UUID coordinatorId);
}
