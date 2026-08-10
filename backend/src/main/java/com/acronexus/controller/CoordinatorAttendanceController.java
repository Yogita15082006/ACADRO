package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.BulkAttendanceRequestDto;
import com.acronexus.dto.CoordinatorScheduleDto;
import com.acronexus.dto.CoordinatorStudentDto;
import com.acronexus.service.CoordinatorAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/coordinator-attendance")
@RequiredArgsConstructor
public class CoordinatorAttendanceController {

    private final CoordinatorAttendanceService service;

    @GetMapping("/my-students")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<com.acronexus.dto.CoordinatorSectionStudentsDto>> getMyStudents() {
        return ResponseEntity.ok(ApiResponse.success(
                "Students fetched successfully", 
                service.getMyStudents()
        ));
    }

    @GetMapping("/schedule")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<CoordinatorScheduleDto>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(
                "Schedule fetched successfully", 
                service.getScheduleForDate(date)
        ));
    }

    @PostMapping("/add-bulk")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<String>> addBulkAttendance(@Valid @RequestBody BulkAttendanceRequestDto request) {
        service.addBulkAttendance(request);
        return ResponseEntity.ok(ApiResponse.success("Attendance added successfully", null));
    }
}
