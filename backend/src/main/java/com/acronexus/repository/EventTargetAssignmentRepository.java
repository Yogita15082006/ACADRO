package com.acronexus.repository;

import com.acronexus.entity.EventTargetAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventTargetAssignmentRepository extends JpaRepository<EventTargetAssignment, UUID> {
    List<EventTargetAssignment> findByEventId(UUID eventId);
    void deleteByEventId(UUID eventId);
}
