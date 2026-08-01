package com.acronexus.repository;

import com.acronexus.entity.LectureMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LectureMaterialRepository extends JpaRepository<LectureMaterial, UUID> {

    @Query("SELECT COUNT(lm) > 0 FROM LectureMaterial lm WHERE lm.uploadedBy.id = :facultyId AND lm.classSubject.id = :classSubjectId AND LOWER(lm.title) = LOWER(CAST(:title AS string)) AND lm.isActive = true AND lm.isDeleted = false")
    boolean existsByFacultyAndSubjectAndTitle(@Param("facultyId") UUID facultyId, @Param("classSubjectId") UUID classSubjectId, @Param("title") String title);

    @Query("SELECT lm FROM LectureMaterial lm JOIN FETCH lm.file JOIN FETCH lm.classSubject cs JOIN FETCH cs.subject JOIN FETCH cs.acroClass WHERE lm.isDeleted = false AND lm.uploadedBy.id = :facultyId")
    List<LectureMaterial> findByUploadedById(@Param("facultyId") UUID facultyId);

    @Query("SELECT lm FROM LectureMaterial lm JOIN FETCH lm.file JOIN FETCH lm.classSubject cs JOIN FETCH cs.subject JOIN FETCH cs.acroClass WHERE lm.isActive = true AND lm.isDeleted = false AND cs.acroClass.id = :classId")
    List<LectureMaterial> findActiveByClassId(@Param("classId") UUID classId);

    @Query("SELECT lm FROM LectureMaterial lm JOIN FETCH lm.file JOIN FETCH lm.classSubject cs JOIN FETCH cs.subject JOIN FETCH cs.acroClass WHERE lm.id = :id AND lm.isDeleted = false")
    Optional<LectureMaterial> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT lm FROM LectureMaterial lm JOIN FETCH lm.file JOIN FETCH lm.classSubject cs JOIN FETCH cs.subject JOIN FETCH cs.acroClass WHERE lm.id = :id AND lm.isActive = true AND lm.isDeleted = false AND cs.acroClass.id = :classId")
    Optional<LectureMaterial> findByIdAndClassId(@Param("id") UUID id, @Param("classId") UUID classId);

    long countByIsDeletedFalseAndIsActiveTrue();
    long countByUploadedByIdAndIsDeletedFalse(UUID facultyId);

    @Query("SELECT COUNT(lm) FROM LectureMaterial lm WHERE lm.isDeleted = false AND lm.isActive = true AND lm.classSubject.acroClass.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);

    @Query("SELECT lm FROM LectureMaterial lm LEFT JOIN FETCH lm.file LEFT JOIN FETCH lm.classSubject cs LEFT JOIN FETCH cs.subject LEFT JOIN FETCH cs.acroClass LEFT JOIN FETCH lm.uploadedBy WHERE lm.classSubject.id = :classSubjectId AND lm.isDeleted = false ORDER BY lm.uploadedAt DESC")
    List<LectureMaterial> findByClassSubjectIdAndIsDeletedFalse(@Param("classSubjectId") UUID classSubjectId);
}
