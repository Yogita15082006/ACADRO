package com.acronexus.repository;

import com.acronexus.entity.AddressDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AddressDetailsRepository extends JpaRepository<AddressDetails, UUID> {
}
