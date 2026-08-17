package com.acronexus.repository;

import com.acronexus.entity.Notice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, UUID>, JpaSpecificationExecutor<Notice> {

    @Override
    @EntityGraph(attributePaths = {"file", "publishedBy", "targetAssignments"})
    List<Notice> findAll(org.springframework.data.jpa.domain.Specification<Notice> spec);

    @Query("SELECT DISTINCT n FROM Notice n " +
           "LEFT JOIN FETCH n.file " +
           "LEFT JOIN FETCH n.publishedBy " +
           "LEFT JOIN n.targetAssignments ta " +
           "WHERE n.isActive = true " +
           "  AND n.isDeleted = false " +
           "  AND (n.publishDate IS NULL OR n.publishDate <= CURRENT_TIMESTAMP) " +
           "  AND (n.expiryDate IS NULL OR n.expiryDate >= CURRENT_TIMESTAMP) " +
           "  AND (" +
           "    (ta IS NOT NULL AND (ta.acroClass.id = :classId OR (ta.isEntireBatch = true AND ta.batchYear = :batchYear))) " +
           "    OR " +
           "    (ta IS NULL AND NOT EXISTS (SELECT 1 FROM NoticeTargetAssignment nta WHERE nta.notice = n)) " +
           "  ) " +
           "ORDER BY n.priority DESC, n.publishDate DESC")
    List<Notice> findStudentFeed(
            @Param("classId") UUID classId,
            @Param("batchYear") String batchYear
    );
    
    @EntityGraph(attributePaths = {"file", "publishedBy", "targetAssignments"})
    List<Notice> findAll();

    long countByIsDeletedFalseAndIsActiveTrue();
    @Query("SELECT COUNT(DISTINCT n) FROM Notice n " +
           "LEFT JOIN n.targetAssignments ta " +
           "WHERE n.isDeleted = false AND n.isActive = true " +
           "  AND (ta IS NULL OR ta.acroClass.department.id = :departmentId)")
    long countByTargetDepartmentIdAndIsDeletedFalseAndIsActiveTrue(@Param("departmentId") UUID departmentId);
}
