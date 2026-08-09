package com.acronexus.repository;

import com.acronexus.entity.EventNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventNoticeRepository extends JpaRepository<EventNotice, UUID> {
    List<EventNotice> findByEventIdOrderByCreatedAtDesc(UUID eventId);
}
