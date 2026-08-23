package com.acronexus.repository;

import com.acronexus.entity.EventAttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventAttendanceRecordRepository extends JpaRepository<EventAttendanceRecord, UUID> {
    List<EventAttendanceRecord> findBySessionId(UUID sessionId);
    Optional<EventAttendanceRecord> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);
    boolean existsBySessionIdAndStudentId(UUID sessionId, UUID studentId);
    boolean existsBySessionIdAndUniqueCodeUsed(UUID sessionId, Integer uniqueCodeUsed);
    
    @org.springframework.data.jpa.repository.Query("SELECT r FROM EventAttendanceRecord r WHERE r.student.id = :studentId AND r.session.isIncludedInOverall = true AND r.session.status = :sessionStatus AND r.session.sessionStartTime >= :startDate AND r.session.sessionStartTime <= :endDate")
    List<EventAttendanceRecord> findByStudentIdAndSessionIsIncludedInOverallTrueAndSessionStatus(@org.springframework.data.repository.query.Param("studentId") UUID studentId, @org.springframework.data.repository.query.Param("sessionStatus") String sessionStatus, @org.springframework.data.repository.query.Param("startDate") java.time.Instant startDate, @org.springframework.data.repository.query.Param("endDate") java.time.Instant endDate);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM EventAttendanceRecord r WHERE r.student.id IN :studentIds AND r.session.isIncludedInOverall = true AND r.session.status = :sessionStatus AND r.session.sessionStartTime >= :startDate AND r.session.sessionStartTime <= :endDate")
    List<EventAttendanceRecord> findByStudentIdInAndSessionIsIncludedInOverallTrueAndSessionStatus(@org.springframework.data.repository.query.Param("studentIds") List<UUID> studentIds, @org.springframework.data.repository.query.Param("sessionStatus") String sessionStatus, @org.springframework.data.repository.query.Param("startDate") java.time.Instant startDate, @org.springframework.data.repository.query.Param("endDate") java.time.Instant endDate);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM EventAttendanceRecord r WHERE r.session.id IN :sessionIds")
    void deleteBySessionIdIn(@org.springframework.data.repository.query.Param("sessionIds") List<UUID> sessionIds);
}
