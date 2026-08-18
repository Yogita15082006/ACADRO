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

    @GetMapping("/test/{userId}")
    public ResponseEntity<ApiResponse<ProfileDto>> testProfile(@PathVariable java.util.UUID userId) {
        return ResponseEntity.ok(ApiResponse.success("Test profile fetched successfully", profileService.getFullProfile(userId)));
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

    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> uploadProfilePhoto(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String photoUrl = profileService.uploadProfilePhoto(userDetails.getId(), file);
            return ResponseEntity.ok(ApiResponse.success("Profile photo uploaded successfully", java.util.Map.of("url", photoUrl)));
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("error_log.txt", true));
                pw.println("Error uploading photo:");
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ex) {}
            throw e;
        }
    }

    @PostMapping("/document")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> uploadProfileDocument(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String documentUrl = profileService.uploadProfileDocument(userDetails.getId(), file);
            return ResponseEntity.ok(ApiResponse.success("Profile document uploaded successfully", java.util.Map.of("url", documentUrl)));
        } catch (Exception e) {
            throw e;
        }
    }
}
