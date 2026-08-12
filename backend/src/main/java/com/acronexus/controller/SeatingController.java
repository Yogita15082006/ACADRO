package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.seating.SeatingArrangementDto;
import com.acronexus.dto.seating.SeatingGenerateRequestDto;
import com.acronexus.service.SeatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/examinations/{examinationId}/seating")
public class SeatingController {

    @Autowired
    private SeatingService seatingService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<SeatingArrangementDto>> generateSeatingPlan(
            @PathVariable UUID examinationId,
            @RequestBody SeatingGenerateRequestDto request) {
        request.setExaminationId(examinationId);
        SeatingArrangementDto plan = seatingService.generateSeatingPlan(request);
        return ResponseEntity.ok(ApiResponse.success("Seating plan generated successfully", plan));
    }

    @PostMapping("/save")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<SeatingArrangementDto>> saveSeatingPlan(
            @PathVariable UUID examinationId,
            @RequestBody SeatingArrangementDto request) {
        request.setExaminationId(examinationId);
        SeatingArrangementDto plan = seatingService.saveSeatingPlan(request);
        return ResponseEntity.ok(ApiResponse.success("Seating plan saved successfully", plan));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY', 'STUDENT')")
    public ResponseEntity<ApiResponse<SeatingArrangementDto>> getSeatingPlan(@PathVariable UUID examinationId) {
        SeatingArrangementDto plan = seatingService.getSeatingPlan(examinationId);
        return ResponseEntity.ok(ApiResponse.success("Seating plan fetched successfully", plan));
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD', 'COORDINATOR', 'FACULTY')")
    public ResponseEntity<ApiResponse<Void>> deleteSeatingPlan(@PathVariable UUID examinationId) {
        seatingService.deleteSeatingPlan(examinationId);
        return ResponseEntity.ok(ApiResponse.success("Seating plan deleted successfully", null));
    }
}
