package com.acronexus.repository;

import com.acronexus.entity.EventAttendanceSessionSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EventAttendanceSessionSubjectRepository extends JpaRepository<EventAttendanceSessionSubject, UUID> {
    
    List<EventAttendanceSessionSubject> findByClassSubjectIdIn(List<UUID> classSubjectIds);
    
    @Modifying
    @Query("DELETE FROM EventAttendanceSessionSubject e WHERE e.classSubject.id IN :classSubjectIds")
    void deleteByClassSubjectIds(@Param("classSubjectIds") List<UUID> classSubjectIds);
}
