package com.acronexus.repository;

import com.acronexus.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    @EntityGraph(attributePaths = {"department", "targetClass", "posterFile", "createdBy"})
    Page<Event> findAllByDepartmentId(UUID departmentId, Pageable pageable);

    @EntityGraph(attributePaths = {"department", "targetClass", "posterFile", "createdBy"})
    Page<Event> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"department", "targetClass", "posterFile", "createdBy"})
    Optional<Event> findById(UUID id);

    @Query("SELECT DISTINCT e FROM Event e " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.posterFile " +
           "LEFT JOIN FETCH e.createdBy " +
           "LEFT JOIN e.targetAssignments ta " +
           "WHERE e.isActive = true " +
           "AND (" +
             "  (ta IS NOT NULL AND (ta.acroClass.id = :classId OR (ta.isEntireBatch = true AND ta.batchYear = :batchYear))) " +
             "  OR " +
             "  (ta IS NULL AND (e.department.id = :departmentId OR e.department IS NULL)) " +
             ") " +
           "AND e.eventDate >= :now " +
           "ORDER BY e.eventDate ASC")
    List<Event> findAvailableEventsForStudent(@Param("departmentId") UUID departmentId, @Param("classId") UUID classId, @Param("batchYear") String batchYear, @Param("now") Instant now);
}
