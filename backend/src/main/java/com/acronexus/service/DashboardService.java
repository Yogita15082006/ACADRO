package com.acronexus.service;

import com.acronexus.dto.response.AdminDashboardResponse;
import com.acronexus.dto.response.FacultyDashboardResponse;
import com.acronexus.dto.response.HodDashboardResponse;
import com.acronexus.dto.response.StudentDashboardResponse;
import com.acronexus.dto.response.CoordinatorDashboardResponse;

import java.util.UUID;

public interface DashboardService {

    StudentDashboardResponse getStudentDashboard(UUID userId);

    FacultyDashboardResponse getFacultyDashboard(UUID userId);

    CoordinatorDashboardResponse getCoordinatorDashboard(UUID userId);

    HodDashboardResponse getHodDashboard(UUID userId);

    AdminDashboardResponse getAdminDashboard();
}
