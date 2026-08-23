package com.acronexus.repository;

import com.acronexus.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, UUID> {
    List<AttendanceSession> findByFacultyId(UUID facultyId);
    List<AttendanceSession> findByClassSubjectId(UUID classSubjectId);
    List<AttendanceSession> findByClassSubjectIdAndStatus(UUID classSubjectId, com.acronexus.entity.AttendanceSessionStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AttendanceSession aso WHERE aso.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@org.springframework.data.repository.query.Param("csIds") List<UUID> csIds);

    java.util.Optional<AttendanceSession> findTopByFacultyIdAndClassSubjectIdAndDateOrderByCreatedAtDesc(UUID facultyId, UUID classSubjectId, java.time.LocalDate date);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.date) FROM AttendanceSession a WHERE a.faculty.id = :facultyId AND (a.isSystemGenerated = false OR a.isSystemGenerated IS NULL) AND a.status IN ('SAVED', 'COMPLETED', 'CLOSED')")
    long countDaysPresentByFacultyId(@org.springframework.data.repository.query.Param("facultyId") UUID facultyId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.date FROM AttendanceSession a WHERE a.faculty.id = :facultyId AND (a.isSystemGenerated = false OR a.isSystemGenerated IS NULL) AND a.status IN ('SAVED', 'COMPLETED', 'CLOSED')")
    java.util.Set<java.time.LocalDate> findWorkingDatesByFacultyId(@org.springframework.data.repository.query.Param("facultyId") UUID facultyId);
}
