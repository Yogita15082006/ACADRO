package com.acronexus.repository;

import com.acronexus.entity.StudentAttendanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface StudentAttendanceHistoryRepository extends JpaRepository<StudentAttendanceHistory, UUID> {
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM StudentAttendanceHistory h WHERE h.attendance.id IN (SELECT a.id FROM StudentAttendance a WHERE a.classSubject.id IN :csIds)")
    void deleteByClassSubjectIds(@org.springframework.data.repository.query.Param("csIds") java.util.List<UUID> csIds);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM StudentAttendanceHistory h WHERE h.attendance.session.id = :sessionId")
    void deleteBySessionId(@org.springframework.data.repository.query.Param("sessionId") UUID sessionId);
}
