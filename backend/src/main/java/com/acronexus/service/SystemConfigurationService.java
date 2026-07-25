package com.acronexus.service;

import com.acronexus.dto.SystemConfigurationRequestDto;
import com.acronexus.dto.ApiResponse;

public interface SystemConfigurationService {
    ApiResponse<String> configureSemester(SystemConfigurationRequestDto requestDto);
}
