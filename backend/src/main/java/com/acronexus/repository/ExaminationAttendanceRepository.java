package com.acronexus.repository;

import com.acronexus.entity.ExaminationAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExaminationAttendanceRepository extends JpaRepository<ExaminationAttendance, UUID> {
    List<ExaminationAttendance> findByExaminationId(UUID examinationId);
    Optional<ExaminationAttendance> findByExaminationIdAndStudentId(UUID examinationId, UUID studentId);
}
