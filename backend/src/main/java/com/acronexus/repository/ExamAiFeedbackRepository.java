package com.acronexus.repository;

import com.acronexus.entity.ExamAiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ExamAiFeedbackRepository extends JpaRepository<ExamAiFeedback, UUID> {
    java.util.Optional<ExamAiFeedback> findByExaminationIdAndStudentId(UUID examinationId, UUID studentId);
    
    @org.springframework.data.jpa.repository.Query("SELECT f FROM ExamAiFeedback f JOIN StudentEnrollment se ON f.student.id = se.student.id WHERE f.examination.id = :examinationId AND se.acroClass.name = :className AND se.isActive = true")
    java.util.List<ExamAiFeedback> findByExaminationIdAndClassName(@org.springframework.data.repository.query.Param("examinationId") UUID examinationId, @org.springframework.data.repository.query.Param("className") String className);
    
    java.util.List<ExamAiFeedback> findByExaminationId(UUID examinationId);
}
