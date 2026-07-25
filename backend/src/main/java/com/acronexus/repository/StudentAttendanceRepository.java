package com.acronexus.repository;

import com.acronexus.entity.StudentAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
@Repository
public interface StudentAttendanceRepository extends JpaRepository<StudentAttendance, UUID> {
    boolean existsByStudentIdAndClassSubjectIdAndDate(UUID studentId, UUID classSubjectId, java.time.LocalDate date);
    
    // For Student: My Attendance History
    List<StudentAttendance> findByStudentIdOrderByDateDesc(UUID studentId);
    
    // For Student: Subject-wise attendance
    @Query("SELECT sa.classSubject.subject.name as subjectName, " +
           "COUNT(sa.id) as totalClasses, " +
           "SUM(CASE WHEN sa.status = 'PRESENT' THEN 1 ELSE 0 END) as classesAttended, " +
           "SUM(CASE WHEN sa.status = 'ABSENT' THEN 1 ELSE 0 END) as classesMissed " +
           "FROM StudentAttendance sa " +
           "WHERE sa.student.id = :studentId " +
           "GROUP BY sa.classSubject.subject.name")
    List<Object[]> getSubjectWiseAttendance(@Param("studentId") UUID studentId);

    // For Student: Overall attendance
    @Query("SELECT COUNT(sa.id) as totalClasses, " +
           "SUM(CASE WHEN sa.status = 'PRESENT' THEN 1 ELSE 0 END) as totalPresent, " +
           "SUM(CASE WHEN sa.status = 'ABSENT' THEN 1 ELSE 0 END) as totalAbsent " +
           "FROM StudentAttendance sa " +
           "WHERE sa.student.id = :studentId")
    Object getOverallAttendance(@Param("studentId") UUID studentId);

    // For Student: Monthly Attendance
    @Query("SELECT sa FROM StudentAttendance sa " +
           "WHERE sa.student.id = :studentId " +
           "AND EXTRACT(MONTH FROM sa.date) = :month " +
           "AND sa.classSubject.academicYear.id = :academicYearId " +
           "AND sa.classSubject.semester.id = :semesterId " +
           "ORDER BY sa.date DESC")
    List<StudentAttendance> findMonthlyAttendance(@Param("studentId") UUID studentId,
                                                  @Param("month") int month,
                                                  @Param("academicYearId") UUID academicYearId,
                                                  @Param("semesterId") UUID semesterId);
    
    // For Faculty: Daily Attendance Register
    @Query("SELECT sa FROM StudentAttendance sa " +
           "WHERE sa.classSubject.id = :classSubjectId AND sa.date = :date")
    List<StudentAttendance> findByClassSubjectIdAndDate(@Param("classSubjectId") UUID classSubjectId, 
                                                        @Param("date") java.time.LocalDate date);
    
    // For Faculty: Class Attendance Summary
    @Query("SELECT sa.classSubject.acroClass.name as className, " +
           "sa.classSubject.subject.name as subjectName, " +
           "COUNT(DISTINCT sa.student.id) as totalStudents, " +
           "SUM(CASE WHEN sa.status = 'PRESENT' THEN 1 ELSE 0 END) as totalPresent, " +
           "SUM(CASE WHEN sa.status = 'ABSENT' THEN 1 ELSE 0 END) as totalAbsent " +
           "FROM StudentAttendance sa " +
           "WHERE sa.classSubject.id = :classSubjectId " +
           "GROUP BY sa.classSubject.acroClass.name, sa.classSubject.subject.name")
    Object getClassAttendanceSummary(@Param("classSubjectId") UUID classSubjectId);
    
    // For Admin: Student Lookup
    @Query("SELECT sa FROM StudentAttendance sa " +
           "WHERE sa.student.enrollmentNo = :enrollmentNo OR " +
           "LOWER(sa.student.user.firstName) LIKE LOWER(CONCAT('%', CAST(:studentName AS string), '%')) OR " +
           "LOWER(sa.student.user.lastName) LIKE LOWER(CONCAT('%', CAST(:studentName AS string), '%')) " +
           "ORDER BY sa.date DESC")
    List<StudentAttendance> findByEnrollmentNoOrStudentName(@Param("enrollmentNo") String enrollmentNo, 
                                                            @Param("studentName") String studentName);

    // For Batch Optimization: Faculty/Class history
    @Query("SELECT sa.classSubject.id, sa.date, " +
           "SUM(CASE WHEN sa.status = 'PRESENT' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN sa.status = 'ABSENT' THEN 1 ELSE 0 END) " +
           "FROM StudentAttendance sa " +
           "WHERE sa.classSubject.id IN :classSubjectIds " +
           "GROUP BY sa.classSubject.id, sa.date")
    List<Object[]> getAttendanceCountsForClassSubjects(@Param("classSubjectIds") List<UUID> classSubjectIds);

    // For Reports: Class Student Attendance Summary
    @Query("SELECT sa.student.id, sa.student.user.firstName, sa.student.user.lastName, sa.student.enrollmentNo, " +
           "COUNT(sa.id), " +
           "SUM(CASE WHEN sa.status = 'PRESENT' THEN 1 ELSE 0 END) " +
           "FROM StudentAttendance sa " +
           "WHERE sa.classSubject.acroClass.id = :classId " +
           "GROUP BY sa.student.id, sa.student.user.firstName, sa.student.user.lastName, sa.student.enrollmentNo")
    List<Object[]> getClassStudentAttendanceSummary(@Param("classId") UUID classId);

    // For Reports: Department Class Attendance Summary
    @Query("SELECT sa.classSubject.acroClass.id, sa.classSubject.acroClass.name, " +
           "COUNT(DISTINCT sa.student.id), " +
           "COUNT(sa.id), " +
           "SUM(CASE WHEN sa.status = 'PRESENT' THEN 1 ELSE 0 END) " +
           "FROM StudentAttendance sa " +
           "WHERE sa.classSubject.acroClass.department.id = :departmentId " +
           "AND sa.classSubject.academicYear.id = :academicYearId " +
           "AND sa.classSubject.semester.id = :semesterId " +
           "GROUP BY sa.classSubject.acroClass.id, sa.classSubject.acroClass.name")
    List<Object[]> getDepartmentClassAttendanceSummary(@Param("departmentId") UUID departmentId, 
                                                       @Param("academicYearId") UUID academicYearId, 
                                                       @Param("semesterId") UUID semesterId);

    @Query("SELECT COUNT(sa) FROM StudentAttendance sa WHERE sa.classSubject.acroClass.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);
}
