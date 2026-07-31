package com.acronexus.repository;

import com.acronexus.entity.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, UUID> {
    List<TimetableSlot> findByTimetableId(UUID timetableId);
    void deleteByTimetableId(UUID timetableId);
    List<TimetableSlot> findByFacultyId(UUID facultyId);
    List<TimetableSlot> findByFacultyIdAndIsActiveTrue(UUID facultyId);
}
