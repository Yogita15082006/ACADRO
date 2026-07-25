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
}
