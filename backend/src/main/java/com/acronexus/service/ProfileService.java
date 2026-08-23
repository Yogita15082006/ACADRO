package com.acronexus.service;

import com.acronexus.dto.profile.ProfileDto;

import java.util.UUID;

public interface ProfileService {
    ProfileDto getFullProfile(UUID userId);
    ProfileDto updateFullProfile(UUID userId, ProfileDto profileDto);
    
    String uploadProfilePhoto(UUID userId, org.springframework.web.multipart.MultipartFile file);
    String uploadProfileDocument(UUID userId, org.springframework.web.multipart.MultipartFile file);
    String uploadSemesterMarksheet(UUID userId, int semester, org.springframework.web.multipart.MultipartFile file);
}
