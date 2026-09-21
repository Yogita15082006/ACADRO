package com.acronexus.service;

import java.util.UUID;

public interface AcademicConfigurationService {
    void activateAcademicYear(UUID academicYearId);
    void activateSemester(UUID semesterId);
}
