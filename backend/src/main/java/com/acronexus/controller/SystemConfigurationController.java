package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.SystemConfigurationRequestDto;
import com.acronexus.service.SystemConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemConfigurationController {

    private final SystemConfigurationService systemConfigurationService;

    @PostMapping("/configure-semester")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<String>> configureSemester(@RequestBody SystemConfigurationRequestDto requestDto) {
        ApiResponse<String> response = systemConfigurationService.configureSemester(requestDto);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
