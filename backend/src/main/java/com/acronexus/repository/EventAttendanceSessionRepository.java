package com.acronexus.repository;

import com.acronexus.entity.EventAttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventAttendanceSessionRepository extends JpaRepository<EventAttendanceSession, UUID> {
    List<EventAttendanceSession> findByEventId(UUID eventId);
    List<EventAttendanceSession> findByEventIdOrderByCreatedAtDesc(UUID eventId);
}
