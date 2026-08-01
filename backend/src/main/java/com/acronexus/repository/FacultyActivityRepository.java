package com.acronexus.repository;

import com.acronexus.entity.FacultyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
@Repository
public interface FacultyActivityRepository extends JpaRepository<FacultyActivity, UUID> {
    Optional<FacultyActivity> findByReason(String reason);
    int countByFacultyIdAndClassSubjectIdAndDate(UUID facultyId, UUID classSubjectId, LocalDate date);

    @Query("SELECT fa FROM FacultyActivity fa " +
           "WHERE fa.faculty.id = :facultyId " +
           "ORDER BY fa.date DESC")
    List<FacultyActivity> findByFacultyIdOrderByDateDesc(@Param("facultyId") UUID facultyId);

    @Query("SELECT fa FROM FacultyActivity fa " +
           "WHERE LOWER(fa.faculty.user.firstName) LIKE LOWER(CONCAT('%', CAST(:facultyName AS string), '%')) OR " +
           "LOWER(fa.faculty.user.lastName) LIKE LOWER(CONCAT('%', CAST(:facultyName AS string), '%')) OR " +
           "fa.faculty.employeeId = :employeeId " +
           "ORDER BY fa.date DESC")
    List<FacultyActivity> findByFacultyNameOrEmployeeId(@Param("facultyName") String facultyName, 
                                                        @Param("employeeId") String employeeId);

    @Query("SELECT fa FROM FacultyActivity fa " +
           "WHERE fa.classSubject.academicYear.id = :academicYearId " +
           "AND fa.classSubject.semester.id = :semesterId " +
           "AND fa.classSubject.acroClass.id = :classId " +
           "AND fa.classSubject.subject.id = :subjectId " +
           "ORDER BY fa.date DESC")
    List<FacultyActivity> findByClassAttendanceLookup(@Param("academicYearId") UUID academicYearId,
                                                      @Param("semesterId") UUID semesterId,
                                                      @Param("classId") UUID classId,
                                                      @Param("subjectId") UUID subjectId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM FacultyActivity fa WHERE fa.classSubject.id IN :csIds")
    void deleteByClassSubjectIds(@Param("csIds") List<UUID> csIds);
}
