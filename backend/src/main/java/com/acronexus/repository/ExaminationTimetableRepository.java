package com.acronexus.repository;

import com.acronexus.entity.ExaminationTimetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface ExaminationTimetableRepository extends JpaRepository<ExaminationTimetable, UUID> {
    List<ExaminationTimetable> findByExaminationId(UUID examinationId);
}
