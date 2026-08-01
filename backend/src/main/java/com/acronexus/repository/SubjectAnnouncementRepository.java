package com.acronexus.repository;

import com.acronexus.entity.SubjectAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectAnnouncementRepository extends JpaRepository<SubjectAnnouncement, UUID> {
    List<SubjectAnnouncement> findByClassSubjectIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID classSubjectId);
    Optional<SubjectAnnouncement> findByIdAndIsDeletedFalse(UUID id);
}
