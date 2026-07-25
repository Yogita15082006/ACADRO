package com.acronexus.repository;

import com.acronexus.entity.FamilyDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FamilyDetailsRepository extends JpaRepository<FamilyDetails, UUID> {
}
