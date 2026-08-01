package com.acronexus.repository;

import com.acronexus.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {
    
    @EntityGraph(attributePaths = {"assignment", "student", "student.user", "file"})
    List<AssignmentSubmission> findByAssignmentIdOrderBySubmittedAtDesc(UUID assignmentId);
    
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);

    @org.springframework.data.jpa.repository.Query("SELECT s.file.id FROM AssignmentSubmission s WHERE s.assignment.classSubject.id IN :csIds AND s.file IS NOT NULL")
    List<UUID> findFileIdsByClassSubjectIds(@org.springframework.data.repository.query.Param("csIds") List<UUID> csIds);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AssignmentSubmission s WHERE s.assignment.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@org.springframework.data.repository.query.Param("csIds") List<UUID> csIds);

    @EntityGraph(attributePaths = {"assignment", "student", "student.user", "file"})
    List<AssignmentSubmission> findByStudentId(UUID studentId);

    @EntityGraph(attributePaths = {"assignment", "student", "student.user", "file"})
    List<AssignmentSubmission> findByAssignment_ClassSubject_Id(UUID classSubjectId);
}
