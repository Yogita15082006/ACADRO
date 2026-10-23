package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.faculty.*;
import com.acronexus.dto.response.AssignedSubjectDto;
import com.acronexus.dto.response.FacultyActivityRecordDto;
import com.acronexus.entity.*;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.FacultyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/faculty-profile")
@RequiredArgsConstructor
public class FacultyProfileController {

    private final ClassSubjectRepository classSubjectRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final FacultyProfileService facultyProfileService;

    // ==========================================
    // COMPLETE FACULTY PROFILE ENDPOINTS
    // ==========================================

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyProfileDto>> getMyProfile(@AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyProfileDto profile = facultyProfileService.getFacultyProfile(actor.getId(), actor);
        return ResponseEntity.ok(ApiResponse.success("Faculty profile fetched successfully", profile));
    }

    // ==========================================
    // HOD DEPARTMENT FACULTY REPORT ENDPOINTS
    // ==========================================

    @GetMapping("/department/all")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FacultyProfileDto>>> getDepartmentFacultyProfiles(@AuthenticationPrincipal UserDetailsImpl actor) {
        List<FacultyProfileDto> list = facultyProfileService.getDepartmentFacultyProfiles(actor);
        return ResponseEntity.ok(ApiResponse.success("Department faculty profiles fetched successfully", list));
    }

    @GetMapping("/department/export-excel")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<byte[]> exportDepartmentFacultyExcel(@AuthenticationPrincipal UserDetailsImpl actor) {
        byte[] excelBytes = facultyProfileService.exportDepartmentFacultyExcel(actor);
        String filename = "Department_Faculty_Report_" + LocalDate.now() + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/{facultyId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyProfileDto>> getProfileById(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyProfileDto profile = facultyProfileService.getFacultyProfile(facultyId, actor);
        return ResponseEntity.ok(ApiResponse.success("Faculty profile fetched successfully", profile));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyProfileDto>> updateMyProfile(
            @RequestBody FacultyProfileDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyProfileDto updated = facultyProfileService.updateFacultyProfile(actor.getId(), dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/{facultyId}")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyProfileDto>> updateProfileById(
            @PathVariable UUID facultyId,
            @RequestBody FacultyProfileDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyProfileDto updated = facultyProfileService.updateFacultyProfile(facultyId, dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Faculty profile updated successfully", updated));
    }

    // ==========================================
    // PROMOTIONS
    // ==========================================

    @GetMapping("/{facultyId}/promotions")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FacultyPromotionDto>>> getPromotions(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        List<FacultyPromotionDto> promotions = facultyProfileService.getPromotions(facultyId, actor);
        return ResponseEntity.ok(ApiResponse.success("Promotions fetched successfully", promotions));
    }

    @PostMapping("/{facultyId}/promotions")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyPromotionDto>> addPromotion(
            @PathVariable UUID facultyId,
            @RequestBody FacultyPromotionDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyPromotionDto created = facultyProfileService.addPromotion(facultyId, dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Promotion added successfully", created));
    }

    @PutMapping("/{facultyId}/promotions/{promotionId}")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyPromotionDto>> updatePromotion(
            @PathVariable UUID facultyId,
            @PathVariable UUID promotionId,
            @RequestBody FacultyPromotionDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyPromotionDto updated = facultyProfileService.updatePromotion(facultyId, promotionId, dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Promotion updated successfully", updated));
    }

    @DeleteMapping("/{facultyId}/promotions/{promotionId}")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(
            @PathVariable UUID facultyId,
            @PathVariable UUID promotionId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        facultyProfileService.deletePromotion(facultyId, promotionId, actor);
        return ResponseEntity.ok(ApiResponse.success("Promotion deleted successfully", null));
    }

    // ==========================================
    // RESEARCH CONTRIBUTIONS
    // ==========================================

    @GetMapping("/{facultyId}/research")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FacultyResearchContributionDto>>> getResearch(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        List<FacultyResearchContributionDto> list = facultyProfileService.getResearchContributions(facultyId, actor);
        return ResponseEntity.ok(ApiResponse.success("Research contributions fetched successfully", list));
    }

    @PostMapping("/{facultyId}/research")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyResearchContributionDto>> addResearch(
            @PathVariable UUID facultyId,
            @RequestBody FacultyResearchContributionDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyResearchContributionDto created = facultyProfileService.addResearchContribution(facultyId, dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Research contribution added successfully", created));
    }

    @DeleteMapping("/{facultyId}/research/{contributionId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteResearch(
            @PathVariable UUID facultyId,
            @PathVariable UUID contributionId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        facultyProfileService.deleteResearchContribution(facultyId, contributionId, actor);
        return ResponseEntity.ok(ApiResponse.success("Research contribution deleted successfully", null));
    }

    // ==========================================
    // RESOURCE PERSONS & COURSES
    // ==========================================

    @GetMapping("/{facultyId}/resource-person")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FacultyResourcePersonDto>>> getResourcePersons(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        List<FacultyResourcePersonDto> list = facultyProfileService.getResourcePersons(facultyId, actor);
        return ResponseEntity.ok(ApiResponse.success("Resource person activities fetched successfully", list));
    }

    @PostMapping("/{facultyId}/resource-person")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyResourcePersonDto>> addResourcePerson(
            @PathVariable UUID facultyId,
            @RequestBody FacultyResourcePersonDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyResourcePersonDto created = facultyProfileService.addResourcePerson(facultyId, dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Resource person activity added successfully", created));
    }

    @DeleteMapping("/{facultyId}/resource-person/{resourcePersonId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteResourcePerson(
            @PathVariable UUID facultyId,
            @PathVariable UUID resourcePersonId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        facultyProfileService.deleteResourcePerson(facultyId, resourcePersonId, actor);
        return ResponseEntity.ok(ApiResponse.success("Resource person activity deleted successfully", null));
    }

    // ==========================================
    // TEACHING WORKLOAD & RESPONSIBILITIES
    // ==========================================

    @GetMapping("/{facultyId}/workload")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyWorkloadDto>> getWorkload(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyWorkloadDto workload = facultyProfileService.getWorkload(facultyId, actor);
        return ResponseEntity.ok(ApiResponse.success("Workload fetched successfully", workload));
    }

    @PutMapping("/{facultyId}/workload")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacultyWorkloadDto>> updateWorkload(
            @PathVariable UUID facultyId,
            @RequestBody FacultyWorkloadDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        FacultyWorkloadDto updated = facultyProfileService.updateWorkload(facultyId, dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Workload updated successfully", updated));
    }

    // ==========================================
    // CLASS & DEPARTMENT STRENGTH
    // ==========================================

    @GetMapping("/class-strength")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ClassStrengthDto>>> getClassStrength(
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Integer semesterNumber,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        List<ClassStrengthDto> list = facultyProfileService.getClassStrengths(departmentId, academicYear, semesterNumber, actor);
        return ResponseEntity.ok(ApiResponse.success("Class strength data fetched successfully", list));
    }

    @PutMapping("/class-strength")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClassStrengthDto>> updateClassStrength(
            @RequestBody ClassStrengthDto dto,
            @AuthenticationPrincipal UserDetailsImpl actor) {
        ClassStrengthDto updated = facultyProfileService.updateClassStrength(dto, actor);
        return ResponseEntity.ok(ApiResponse.success("Class strength updated successfully", updated));
    }

    // ==========================================
    // BACKWARD COMPATIBLE EXISTING ENDPOINTS
    // ==========================================

    @GetMapping("/assigned-subjects")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<AssignedSubjectDto>> getAssignedSubjects(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Faculty faculty = facultyRepository.findById(user.getId()).orElse(null);
        if (faculty == null) {
            return ResponseEntity.badRequest().build();
        }

        List<ClassSubject> classSubjects = classSubjectRepository.findByFacultyIdAndIsActiveTrue(faculty.getId());

        List<AssignedSubjectDto> dtos = classSubjects.stream().map(cs -> {
            AssignedSubjectDto dto = new AssignedSubjectDto();
            dto.setId(cs.getId());
            dto.setFacultyId(faculty.getId());
            dto.setSubjectName(cs.getSubject().getName());
            dto.setClassName(cs.getAcroClass().getFunctionalClassName());
            dto.setSemester(cs.getSemester().getSemesterNumber() != null ? "Semester " + cs.getSemester().getSemesterNumber() : "Unknown");
            dto.setAcademicYear(cs.getAcademicYear().getYear());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/activities")
    @PreAuthorize("hasAnyRole('FACULTY', 'COORDINATOR', 'HOD')")
    public ResponseEntity<List<FacultyActivityRecordDto>> getActivities(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Faculty faculty = facultyRepository.findById(user.getId()).orElse(null);
        if (faculty == null) {
            return ResponseEntity.badRequest().build();
        }

        List<FacultyActivity> activities = facultyActivityRepository.findByFacultyIdOrderByDateDesc(faculty.getId());

        List<FacultyActivityRecordDto> dtos = activities.stream().map(activity -> {
            FacultyActivityRecordDto dto = new FacultyActivityRecordDto();
            dto.setId(activity.getId());
            dto.setFacultyId(faculty.getId());
            
            if (activity.getClassSubject() != null) {
                dto.setSubjectName(activity.getClassSubject().getSubject().getName());
                dto.setClassName(activity.getClassSubject().getAcroClass().getFunctionalClassName());
                dto.setSemester(activity.getClassSubject().getSemester().getSemesterNumber() != null ? "Semester " + activity.getClassSubject().getSemester().getSemesterNumber() : "Unknown");
                dto.setAcademicYear(activity.getClassSubject().getAcademicYear().getYear());
            }

            dto.setDate(activity.getDate());
            
            switch (activity.getStatus()) {
                case PRESENT:
                    dto.setStatus("Present");
                    break;
                case CLASS_MISSED:
                    dto.setStatus("Class Missed");
                    break;
                case ABSENT:
                    dto.setStatus("Absent");
                    break;
                case HOLIDAY:
                    dto.setStatus("Holiday");
                    break;
                default:
                    dto.setStatus(activity.getStatus().name());
            }
            
            dto.setReason(activity.getReason());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
