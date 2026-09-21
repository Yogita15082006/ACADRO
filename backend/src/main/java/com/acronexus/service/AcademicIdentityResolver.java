package com.acronexus.service;

import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicIdentityResolver {

    private final DepartmentRepository departmentRepository;
    private final DegreeProgramRepository degreeProgramRepository;
    private final AcroClassRepository acroClassRepository;

    /**
     * Resolves a Department based on its name.
     * Uses explicit aliases (e.g. IT -> Information Technology) and case-insensitive matching.
     * If no department is found, a new one is created.
     */
    @Transactional
    public Department resolveDepartment(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            return null;
        }

        String normalized = rawName.trim().replaceAll("\\s+", " ");
        String searchName = normalized;

        // Apply explicit confirmed aliases
        if (normalized.equalsIgnoreCase("IT")) {
            searchName = "Information Technology";
        }

        Optional<Department> existing = departmentRepository.findByNameIgnoreCase(searchName);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Also check if the raw alias matches something in DB (e.g. if 'IT' already exists but 'Information Technology' doesn't)
        if (!searchName.equalsIgnoreCase(normalized)) {
            Optional<Department> existingAlias = departmentRepository.findByNameIgnoreCase(normalized);
            if (existingAlias.isPresent()) {
                return existingAlias.get();
            }
        }

        log.info("Creating new Department: {}", searchName);
        Department dept = new Department();
        dept.setName(searchName);
        if (normalized.equalsIgnoreCase("IT")) {
            dept.setCode("IT");
        } else {
            dept.setCode(searchName.substring(0, Math.min(searchName.length(), 4)).toUpperCase());
        }
        dept.setIsActive(true);
        return departmentRepository.save(dept);
    }

    /**
     * Resolves a Degree Program.
     */
    @Transactional
    public DegreeProgram resolveDegreeProgram(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            return null;
        }
        String normalized = rawName.trim().replaceAll("\\s+", " ");
        
        Optional<DegreeProgram> existing = degreeProgramRepository.findByNameIgnoreCase(normalized);
        if (existing.isPresent()) {
            return existing.get();
        }

        log.info("Creating new DegreeProgram: {}", normalized);
        DegreeProgram dp = new DegreeProgram();
        dp.setName(normalized);
        dp.setIsActive(true);
        dp.setDurationYears(4); // Default, can be updated later by admin
        dp.setType(normalized.contains("Tech") || normalized.contains("Eng") ? com.acronexus.entity.DegreeType.UG : com.acronexus.entity.DegreeType.PG);
        return degreeProgramRepository.save(dp);
    }

    /**
     * Resolves an AcroClass. Retains precise semantic meaning of class Name vs Section.
     */
    @Transactional
    public AcroClass resolveClass(String className, String sectionName, Department department, DegreeProgram degree) {
        if (className == null || className.trim().isEmpty()) {
            return null;
        }

        String normalizedClass = className.trim().replaceAll("\\s+", " ");
        String normalizedSection = (sectionName != null && !sectionName.trim().isEmpty()) ? sectionName.trim().replaceAll("\\s+", " ") : null;

        // Try to find exact match
        Optional<AcroClass> existing = acroClassRepository.findAll().stream()
            .filter(c -> c.getName().equalsIgnoreCase(normalizedClass))
            .filter(c -> {
                if (normalizedSection == null) return c.getSection() == null || c.getSection().isEmpty();
                return normalizedSection.equalsIgnoreCase(c.getSection());
            })
            .filter(c -> department == null || (c.getDepartment() != null && c.getDepartment().getId().equals(department.getId())))
            .filter(c -> degree == null || (c.getDegreeProgram() != null && c.getDegreeProgram().getId().equals(degree.getId())))
            .findFirst();

        if (existing.isPresent()) {
            return existing.get();
        }

        log.info("Creating new AcroClass: {} Section: {} in Dept: {}", normalizedClass, normalizedSection, department != null ? department.getName() : "None");
        AcroClass newClass = new AcroClass();
        newClass.setName(normalizedClass);
        newClass.setSection(normalizedSection);
        newClass.setDepartment(department);
        newClass.setDegreeProgram(degree);
        newClass.setIsActive(true);
        return acroClassRepository.save(newClass);
    }
}