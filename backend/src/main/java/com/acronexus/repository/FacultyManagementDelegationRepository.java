package com.acronexus.repository;

import com.acronexus.entity.DelegationStatus;
import com.acronexus.entity.FacultyManagementDelegation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FacultyManagementDelegationRepository extends JpaRepository<FacultyManagementDelegation, UUID> {
    
    List<FacultyManagementDelegation> findByAssignedFacultyIdAndStatus(UUID facultyId, DelegationStatus status);

    List<FacultyManagementDelegation> findByAssignedByIdOrderByAssignedAtDesc(UUID hodId);
    
    @Query("SELECT d FROM FacultyManagementDelegation d WHERE d.assignedFaculty.id = :facultyId AND d.department.id = :departmentId AND d.status = com.acronexus.entity.DelegationStatus.ACTIVE AND d.isActive = true")
    List<FacultyManagementDelegation> findActiveByFacultyAndDepartment(@Param("facultyId") UUID facultyId, @Param("departmentId") UUID departmentId);
    
    @Query("SELECT COUNT(d) > 0 FROM FacultyManagementDelegation d WHERE d.assignedFaculty.id = :facultyId AND d.department.id = :departmentId AND d.status = com.acronexus.entity.DelegationStatus.ACTIVE AND d.isActive = true AND (d.validUntil IS NULL OR d.validUntil > CURRENT_TIMESTAMP)")
    boolean existsActiveValidDelegation(@Param("facultyId") UUID facultyId, @Param("departmentId") UUID departmentId);

    @Query("SELECT COUNT(d) > 0 FROM FacultyManagementDelegation d WHERE d.assignedFaculty.id = :facultyId AND d.status = com.acronexus.entity.DelegationStatus.ACTIVE AND d.isActive = true AND (d.validUntil IS NULL OR d.validUntil > CURRENT_TIMESTAMP)")
    boolean existsAnyActiveValidDelegation(@Param("facultyId") UUID facultyId);
}

