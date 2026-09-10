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

    @org.springframework.data.jpa.repository.Query("SELECT ea FROM ExaminationAttendance ea " +
           "JOIN ea.student s " +
           "JOIN StudentEnrollment se ON se.student = s AND se.isActive = true " +
           "WHERE ea.examination.id = :examinationId " +
           "AND ea.isPresent = true " +
           "AND se.acroClass.id = :classId " +
           "ORDER BY s.enrollmentNo ASC")
    List<ExaminationAttendance> findPresentStudentsByExamAndClassOrdered(
            @org.springframework.data.repository.query.Param("examinationId") UUID examinationId, 
            @org.springframework.data.repository.query.Param("classId") UUID classId);
}
