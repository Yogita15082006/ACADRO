package com.acronexus.repository;

import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    java.util.Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);

    long countByRoleAndIsDeletedFalse(UserRole role);
    long countByDepartmentIdAndRoleAndIsDeletedFalse(UUID departmentId, UserRole role);

    @Query("SELECT u.email FROM User u")
    java.util.List<String> findAllEmails();

    void deleteAllByRole(UserRole role);

    java.util.List<User> findByRoleIn(java.util.List<UserRole> roles);
    java.util.List<User> findByRoleInAndIsDeletedFalse(java.util.List<UserRole> roles);
    java.util.List<User> findAllByIsDeletedFalse();

    @Query("SELECT DISTINCT f.user FROM Faculty f " +
           "LEFT JOIN f.departments fd " +
           "WHERE (f.user.isDeleted = false OR f.user.isDeleted IS NULL) " +
           "AND (f.user.isActive = true OR f.user.isActive IS NULL) " +
           "AND (f.user.department.id IN :departmentIds OR fd.id IN :departmentIds)")
    java.util.List<User> findActiveFacultyUsersByDepartmentIds(@org.springframework.data.repository.query.Param("departmentIds") java.util.List<UUID> departmentIds);
}
