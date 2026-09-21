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
    List<ExaminationAttendance> findByExaminationIdAndExamDateAndClassSubjectId(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    Optional<ExaminationAttendance> findByExaminationIdAndStudentId(UUID examinationId, UUID studentId);
    Optional<ExaminationAttendance> findByExaminationIdAndStudentIdAndExamDateAndClassSubjectId(
            UUID examinationId, UUID studentId, java.time.LocalDate examDate, UUID classSubjectId);
    List<ExaminationAttendance> findByClassSubjectId(UUID classSubjectId);

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

    @org.springframework.data.jpa.repository.Query("SELECT ea FROM ExaminationAttendance ea " +
           "JOIN ea.student s " +
           "WHERE ea.examination.id = :examinationId " +
           "AND ea.examDate = :examDate " +
           "AND ea.classSubject.id = :classSubjectId " +
           "AND ea.isPresent = true " +
           "ORDER BY s.enrollmentNo ASC")
    List<ExaminationAttendance> findPresentStudentsByContextOrdered(
            @org.springframework.data.repository.query.Param("examinationId") UUID examinationId,
            @org.springframework.data.repository.query.Param("examDate") java.time.LocalDate examDate,
            @org.springframework.data.repository.query.Param("classSubjectId") UUID classSubjectId);
            
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT ea.examDate FROM ExaminationAttendance ea " +
           "WHERE ea.examination.id = :examinationId " +
           "AND ea.classSubject.id = :classSubjectId " +
           "AND ea.examDate IS NOT NULL " +
           "ORDER BY ea.examDate ASC")
    List<java.time.LocalDate> findDistinctExamDatesByContext(
            @org.springframework.data.repository.query.Param("examinationId") UUID examinationId,
            @org.springframework.data.repository.query.Param("classSubjectId") UUID classSubjectId);
}
