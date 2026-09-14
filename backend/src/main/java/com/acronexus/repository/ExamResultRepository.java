package com.acronexus.repository;

import com.acronexus.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, UUID> {
    Optional<ExamResult> findByExaminationIdAndStudentIdAndSubjectId(UUID examinationId, UUID studentId, UUID subjectId);
    @org.springframework.data.jpa.repository.Query("SELECT er FROM ExamResult er LEFT JOIN StudentEnrollment se ON er.student.id = se.student.id LEFT JOIN se.acroClass c WHERE er.examination.id = :examinationId AND (er.className = :className OR c.section = :className OR c.name = :className OR CONCAT(c.name, '-', c.section) = :className)")
    java.util.List<ExamResult> findByExaminationIdAndClassName(@org.springframework.data.repository.query.Param("examinationId") UUID examinationId, @org.springframework.data.repository.query.Param("className") String className);
    
    java.util.List<ExamResult> findByExaminationId(UUID examinationId);
    
    java.util.List<ExamResult> findByStudentId(UUID studentId);
    java.util.List<ExamResult> findByStudentIdAndIsPublishedTrue(UUID studentId);
    java.util.List<ExamResult> findByExaminationIdAndStudentId(UUID examinationId, UUID studentId);
    java.util.List<ExamResult> findByExaminationIdAndStudentIdAndIsPublishedTrue(UUID examinationId, UUID studentId);
    
    java.util.List<ExamResult> findByExaminationIdAndExamDateAndClassSubjectId(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId);
    java.util.Optional<ExamResult> findByExaminationIdAndExamDateAndClassSubjectIdAndStudentId(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, UUID studentId);
    java.util.List<ExamResult> findByExaminationIdAndExamDateAndClassSubjectIdAndStudentIdAndIsPublishedTrue(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId, UUID studentId);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ExamResult e SET e.isPublished = true WHERE e.id IN :ids")
    void publishByIds(@org.springframework.data.repository.query.Param("ids") java.util.List<UUID> ids);

    @org.springframework.data.jpa.repository.Query("SELECT new com.acronexus.dto.SavedResultContextDto(" +
            "er.examination.id, er.examination.name, er.examDate, cs.id, sub.id, sub.code, sub.name, " +
            "CASE WHEN c.section IS NOT NULL AND c.section != '' THEN c.section ELSE c.name END, " +
            "0, " +
            "CAST(COUNT(er.id) AS int), " +
            "CAST(SUM(CASE WHEN er.isPublished = true THEN 1 ELSE 0 END) AS int)) " +
            "FROM ExamResult er " +
            "JOIN er.classSubject cs " +
            "JOIN cs.subject sub " +
            "JOIN cs.acroClass c " +
            "WHERE er.examination.id = :examinationId " +
            "GROUP BY er.examination.id, er.examination.name, er.examDate, cs.id, sub.id, sub.code, sub.name, c.name, c.section")
    java.util.List<com.acronexus.dto.SavedResultContextDto> findSavedContextsByExaminationId(@org.springframework.data.repository.query.Param("examinationId") UUID examinationId);
}
