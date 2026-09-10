package com.acronexus.repository;

import com.acronexus.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, java.util.UUID> {
    java.util.Optional<Faculty> findByEmployeeId(String employeeId);

    @org.springframework.data.jpa.repository.Query("SELECT f.employeeId FROM Faculty f WHERE f.employeeId IS NOT NULL")
    java.util.List<String> findAllEmployeeIds();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT f FROM Faculty f JOIN f.departments d " +
            "WHERE d.id IN :departmentIds " +
            "AND f.user.isDeleted = false " +
            "AND f.user.isActive = true")
    java.util.List<Faculty> findActiveFacultyByDepartmentIds(@org.springframework.data.repository.query.Param("departmentIds") java.util.List<java.util.UUID> departmentIds);
}
