package com.acronexus.repository;

import com.acronexus.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    
    List<Quiz> findByCreatedByIdAndIsDeletedFalse(UUID facultyId);

    @Query("SELECT q FROM Quiz q " +
           "JOIN q.classSubject cs " +
           "JOIN cs.acroClass c " +
           "JOIN StudentEnrollment se ON se.acroClass.id = c.id " +
           "JOIN se.student s " +
           "WHERE s.user.id = :studentId " +
           "AND se.isActive = true " +
           "AND q.isDeleted = false")
    List<Quiz> findAvailableQuizzesForStudent(@Param("studentId") UUID studentId);

    @Query("SELECT COUNT(q) > 0 FROM Quiz q " +
           "JOIN q.classSubject cs " +
           "JOIN cs.acroClass c " +
           "JOIN StudentEnrollment se ON se.acroClass.id = c.id " +
           "JOIN se.student s " +
           "WHERE q.id = :quizId AND s.user.id = :studentId AND se.isActive = true AND q.isDeleted = false")
    boolean existsByIdAndStudentId(@Param("quizId") UUID quizId, @Param("studentId") UUID studentId);

    long countByIsDeletedFalse();

    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.isDeleted = false AND q.classSubject.acroClass.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);

    long countByCreatedByIdAndIsDeletedFalse(UUID facultyId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Quiz q WHERE q.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@Param("csIds") List<UUID> csIds);
}
