package com.acronexus.repository;

import com.acronexus.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

import java.util.List;
import com.acronexus.entity.AcroClass;
import com.acronexus.entity.AcademicYear;
import com.acronexus.entity.Semester;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, UUID> {
    List<Timetable> findByAcroClassAndAcademicYearAndSemester(AcroClass acroClass, AcademicYear academicYear, Semester semester);
    List<Timetable> findByAcroClassIdAndAcademicYearIdAndSemesterIdOrderByVersionNumberDesc(UUID classId, UUID academicYearId, UUID semesterId);
    List<Timetable> findByIsActiveTrueOrderByUploadedAtDesc();
}
