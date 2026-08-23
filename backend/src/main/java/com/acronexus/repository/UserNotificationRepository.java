package com.acronexus.repository;

import com.acronexus.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {

    @Query("SELECT n FROM UserNotification n JOIN FETCH n.user WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    List<UserNotification> findByUserIdWithUser(@Param("userId") UUID userId);

    @Query(value = "SELECT n FROM UserNotification n JOIN FETCH n.user WHERE n.user.id = :userId",
           countQuery = "SELECT count(n) FROM UserNotification n WHERE n.user.id = :userId")
    Page<UserNotification> findByUserIdWithUser(@Param("userId") UUID userId, Pageable pageable);

    long countByUser_IdAndIsReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE UserNotification n SET n.isRead = true WHERE n.user.id = :userId")
    void markAllAsReadByUserId(@Param("userId") UUID userId);

    long count();

    @Query("SELECT COUNT(n) FROM UserNotification n WHERE n.user.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);

    boolean existsByUser_IdAndTypeAndReferenceId(UUID userId, String type, String referenceId);
}
