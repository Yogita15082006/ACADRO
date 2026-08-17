package com.acronexus.repository;

import com.acronexus.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, UUID> {
    Optional<ExamResult> findByExaminationIdAndStudentIdAndSubjectId(UUID examinationId, UUID studentId, UUID subjectId);
    @org.springframework.data.jpa.repository.Query("SELECT er FROM ExamResult er JOIN StudentEnrollment se ON er.student.id = se.student.id JOIN se.acroClass c WHERE er.examination.id = :examinationId AND (c.section = :className OR c.name = :className OR CONCAT(c.name, '-', c.section) = :className) AND se.isActive = true")
    java.util.List<ExamResult> findByExaminationIdAndClassName(@org.springframework.data.repository.query.Param("examinationId") UUID examinationId, @org.springframework.data.repository.query.Param("className") String className);
    
    java.util.List<ExamResult> findByExaminationId(UUID examinationId);
    
    java.util.List<ExamResult> findByStudentId(UUID studentId);
    java.util.List<ExamResult> findByStudentIdAndIsPublishedTrue(UUID studentId);
    java.util.List<ExamResult> findByExaminationIdAndStudentId(UUID examinationId, UUID studentId);
    java.util.List<ExamResult> findByExaminationIdAndStudentIdAndIsPublishedTrue(UUID examinationId, UUID studentId);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ExamResult e SET e.isPublished = true WHERE e.id IN :ids")
    void publishByIds(@org.springframework.data.repository.query.Param("ids") java.util.List<UUID> ids);
}
