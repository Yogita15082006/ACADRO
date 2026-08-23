package com.acronexus.repository;

import com.acronexus.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    
    @EntityGraph(attributePaths = {"classSubject", "classSubject.subject", "classSubject.acroClass", "file", "createdBy"})
    @Query("SELECT a FROM Assignment a WHERE a.createdBy.id = :facultyId AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Assignment> findByFacultyId(@Param("facultyId") UUID facultyId);

    @EntityGraph(attributePaths = {"classSubject", "classSubject.subject", "classSubject.acroClass", "file", "createdBy"})
    @Query("SELECT a FROM Assignment a WHERE a.classSubject.id IN " +
           "(SELECT cs.id FROM ClassSubject cs JOIN StudentEnrollment se ON cs.acroClass.id = se.acroClass.id " +
           "WHERE se.student.id = :studentId AND se.isActive = true AND cs.isActive = true) " +
           "AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Assignment> findAssignmentsForStudent(@Param("studentId") UUID studentId);

    @Query("SELECT COUNT(a) > 0 FROM Assignment a WHERE a.id = :assignmentId AND a.classSubject.id IN " +
           "(SELECT cs.id FROM ClassSubject cs JOIN StudentEnrollment se ON cs.acroClass.id = se.acroClass.id " +
           "WHERE se.student.id = :studentId AND se.isActive = true AND cs.isActive = true) " +
           "AND a.isDeleted = false")
    boolean existsByIdAndStudentId(@Param("assignmentId") UUID assignmentId, @Param("studentId") UUID studentId);

    long countByIsDeletedFalse();

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.isDeleted = false AND a.classSubject.acroClass.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);

    long countByCreatedByIdAndIsDeletedFalse(UUID facultyId);

    @Query("SELECT a.file.id FROM Assignment a WHERE a.classSubject.id IN :csIds AND a.file IS NOT NULL")
    List<UUID> findFileIdsByClassSubjectIds(@Param("csIds") List<UUID> csIds);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Assignment a WHERE a.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@Param("csIds") List<UUID> csIds);

    @EntityGraph(attributePaths = {"classSubject", "classSubject.subject", "classSubject.acroClass", "file", "createdBy"})
    List<Assignment> findByClassSubject_IdAndIsDeletedFalseOrderByCreatedAtDesc(UUID classSubjectId);

    List<Assignment> findByClassSubjectId(UUID classSubjectId);

    @EntityGraph(attributePaths = {"classSubject", "classSubject.subject", "classSubject.acroClass", "file", "createdBy"})
    List<Assignment> findByIsDeletedFalseOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"classSubject", "classSubject.acroClass"})
    List<Assignment> findByIsDeletedFalseAndDeadlineBetween(java.time.ZonedDateTime start, java.time.ZonedDateTime end);
}
