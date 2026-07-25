package com.acronexus.repository;

import com.acronexus.entity.SyllabusSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface SyllabusSubjectRepository extends JpaRepository<SyllabusSubject, UUID> {
    List<SyllabusSubject> findByAcademicSyllabusId(UUID academicSyllabusId);
    List<SyllabusSubject> findBySubjectCodeIgnoreCase(String subjectCode);
    List<SyllabusSubject> findBySubjectNameContainingIgnoreCase(String subjectName);
}
