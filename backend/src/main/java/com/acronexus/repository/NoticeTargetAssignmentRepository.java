package com.acronexus.repository;

import com.acronexus.entity.NoticeTargetAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NoticeTargetAssignmentRepository extends JpaRepository<NoticeTargetAssignment, UUID> {
}
