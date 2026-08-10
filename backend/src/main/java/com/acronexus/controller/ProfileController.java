package com.acronexus.controller;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.profile.ProfileDto;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileDto>> getProfile() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profileService.getFullProfile(userDetails.getId())));
    }

    @GetMapping("/{userId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'FACULTY', 'HOD')")
    public ResponseEntity<ApiResponse<ProfileDto>> getProfileById(@PathVariable java.util.UUID userId) {
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profileService.getFullProfile(userId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileDto>> updateProfile(@RequestBody ProfileDto profileDto) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profileService.updateFullProfile(userDetails.getId(), profileDto)));
    }
}
