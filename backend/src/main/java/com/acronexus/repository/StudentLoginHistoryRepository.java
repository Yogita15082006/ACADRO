package com.acronexus.repository;

import com.acronexus.entity.StudentLoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentLoginHistoryRepository extends JpaRepository<StudentLoginHistory, UUID> {

    /** Most recent login for a given student */
    Optional<StudentLoginHistory> findFirstByStudentIdOrderByLoginTimestampDesc(UUID studentId);

    /** Complete login history for a student, newest first */
    List<StudentLoginHistory> findByStudentIdOrderByLoginTimestampDesc(UUID studentId);

    /** Count of login records for a student */
    long countByStudentId(UUID studentId);

    /** Latest login timestamp per student for a batch of student IDs */
    @Query("SELECT h.student.id, MAX(h.loginTimestamp) FROM StudentLoginHistory h " +
           "WHERE h.student.id IN :studentIds GROUP BY h.student.id")
    List<Object[]> findLatestLoginByStudentIds(@Param("studentIds") List<UUID> studentIds);

    /** Login count per student for a batch of student IDs */
    @Query("SELECT h.student.id, COUNT(h) FROM StudentLoginHistory h " +
           "WHERE h.student.id IN :studentIds GROUP BY h.student.id")
    List<Object[]> findLoginCountByStudentIds(@Param("studentIds") List<UUID> studentIds);
}
