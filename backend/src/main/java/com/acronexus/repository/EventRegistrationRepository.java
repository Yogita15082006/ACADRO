package com.acronexus.repository;

import com.acronexus.entity.EventRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, UUID> {

    boolean existsByEventIdAndStudentId(UUID eventId, UUID studentId);

    long countByEventId(UUID eventId);

    @EntityGraph(attributePaths = {"event", "event.department", "event.targetClass", "event.posterFile"})
    List<EventRegistration> findByStudentIdOrderByRegisteredAtDesc(UUID studentId);

    @EntityGraph(attributePaths = {"student", "student.user"})
    Page<EventRegistration> findByEventId(UUID eventId, Pageable pageable);

    @EntityGraph(attributePaths = {"student", "student.user", "student.enrollmentNo"})
    List<EventRegistration> findByEventIdOrderByRegisteredAtDesc(UUID eventId);

    Optional<EventRegistration> findByEventIdAndStudentId(UUID eventId, UUID studentId);
}
