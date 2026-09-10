package com.acronexus.service.impl;

import com.acronexus.entity.AcademicYear;
import com.acronexus.entity.Semester;
import com.acronexus.repository.AcademicYearRepository;
import com.acronexus.repository.SemesterRepository;
import com.acronexus.service.AcademicConfigurationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicConfigurationServiceImpl implements AcademicConfigurationService {

    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;

    @Override
    @Transactional
    public void activateAcademicYear(UUID academicYearId) {
        // 1. Validate Target
        AcademicYear targetYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new IllegalArgumentException("Academic Year not found"));

        // 2. Fetch currently active and deactivate
        List<AcademicYear> activeYears = academicYearRepository.findByIsActiveTrue();
        for (AcademicYear year : activeYears) {
            if (!year.getId().equals(academicYearId)) {
                year.setIsActive(false);
                academicYearRepository.save(year);
                log.info("Deactivated previous Academic Year: {}", year.getYear());
            }
        }

        // 3. Activate target
        if (targetYear.getIsActive() == null || !targetYear.getIsActive()) {
            targetYear.setIsActive(true);
            academicYearRepository.save(targetYear);
            log.info("Activated Academic Year: {}", targetYear.getYear());
        }
    }

    @Override
    @Transactional
    public void activateSemester(UUID semesterId) {
        // 1. Validate Target
        Semester targetSemester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));

        AcademicYear scopedYear = targetSemester.getAcademicYear();
        if (scopedYear == null) {
            throw new IllegalStateException("Semester must belong to an Academic Year to be activated");
        }

        // 2. Fetch currently active in the same scope and deactivate
        List<Semester> activeSemesters = semesterRepository.findByIsActiveTrue();
        for (Semester sem : activeSemesters) {
            // Only deactivate conflicting semesters within the SAME AcademicYear scope
            if (sem.getAcademicYear() != null 
                && sem.getAcademicYear().getId().equals(scopedYear.getId())
                && !sem.getId().equals(semesterId)) {
                
                sem.setIsActive(false);
                semesterRepository.save(sem);
                log.info("Deactivated previous Semester {} for Academic Year {}", sem.getSemesterNumber(), scopedYear.getYear());
            }
        }

        // 3. Activate target
        if (targetSemester.getIsActive() == null || !targetSemester.getIsActive()) {
            targetSemester.setIsActive(true);
            semesterRepository.save(targetSemester);
            log.info("Activated Semester {} for Academic Year {}", targetSemester.getSemesterNumber(), scopedYear.getYear());
        }
    }
}
