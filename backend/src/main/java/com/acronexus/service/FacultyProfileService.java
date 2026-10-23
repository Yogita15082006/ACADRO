package com.acronexus.service;

import com.acronexus.dto.faculty.*;
import com.acronexus.security.UserDetailsImpl;

import java.util.List;
import java.util.UUID;

public interface FacultyProfileService {
    FacultyProfileDto getFacultyProfile(UUID facultyId, UserDetailsImpl actor);
    FacultyProfileDto updateFacultyProfile(UUID facultyId, FacultyProfileDto dto, UserDetailsImpl actor);

    List<FacultyPromotionDto> getPromotions(UUID facultyId, UserDetailsImpl actor);
    FacultyPromotionDto addPromotion(UUID facultyId, FacultyPromotionDto dto, UserDetailsImpl actor);
    FacultyPromotionDto updatePromotion(UUID facultyId, UUID promotionId, FacultyPromotionDto dto, UserDetailsImpl actor);
    void deletePromotion(UUID facultyId, UUID promotionId, UserDetailsImpl actor);

    List<FacultyResearchContributionDto> getResearchContributions(UUID facultyId, UserDetailsImpl actor);
    FacultyResearchContributionDto addResearchContribution(UUID facultyId, FacultyResearchContributionDto dto, UserDetailsImpl actor);
    void deleteResearchContribution(UUID facultyId, UUID contributionId, UserDetailsImpl actor);

    List<FacultyResourcePersonDto> getResourcePersons(UUID facultyId, UserDetailsImpl actor);
    FacultyResourcePersonDto addResourcePerson(UUID facultyId, FacultyResourcePersonDto dto, UserDetailsImpl actor);
    void deleteResourcePerson(UUID facultyId, UUID resourcePersonId, UserDetailsImpl actor);

    FacultyWorkloadDto getWorkload(UUID facultyId, UserDetailsImpl actor);
    FacultyWorkloadDto updateWorkload(UUID facultyId, FacultyWorkloadDto dto, UserDetailsImpl actor);

    List<ClassStrengthDto> getClassStrengths(UUID departmentId, String academicYear, Integer semesterNumber, UserDetailsImpl actor);
    ClassStrengthDto updateClassStrength(ClassStrengthDto dto, UserDetailsImpl actor);

    // HOD Department Faculty Reports & Exports
    List<FacultyProfileDto> getDepartmentFacultyProfiles(UserDetailsImpl actor);
    byte[] exportDepartmentFacultyExcel(UserDetailsImpl actor);
}
