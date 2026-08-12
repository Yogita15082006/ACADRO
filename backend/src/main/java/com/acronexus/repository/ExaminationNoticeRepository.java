package com.acronexus.repository;

import com.acronexus.entity.ExaminationNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExaminationNoticeRepository extends JpaRepository<ExaminationNotice, UUID> {
    List<ExaminationNotice> findByExaminationIdOrderByPublishDateDesc(UUID examinationId);
}
