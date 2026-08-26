package com.acronexus.repository;

import com.acronexus.entity.StudentAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentAchievementRepository extends JpaRepository<StudentAchievement, UUID> {
    List<StudentAchievement> findByStudentId(UUID studentId);
    List<StudentAchievement> findByStudentIdIn(List<UUID> studentIds);
}
