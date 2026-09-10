package com.acronexus.service;

import com.acronexus.dto.FacultyReportDto;
import java.util.UUID;

public interface FacultyReportService {
    FacultyReportDto getFacultyReport(UUID facultyId, UUID requesterId);
}
