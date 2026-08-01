package com.acronexus.service.impl;

import com.acronexus.dto.*;
import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.StudentRepository;
import com.acronexus.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("User not found"));
                
        if (!passwordEncoder.matches(requestDto.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect current password");
        }
        
        user.setPasswordHash(passwordEncoder.encode(requestDto.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequestDto requestDto) {
        // Structure for forgot password
        userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("User not found with email: " + requestDto.getEmail()));
        
        // Generate reset token and send email (to be implemented later)
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequestDto requestDto) {
        // Structure for reset password
        // Validate token (to be implemented later)
        
        // Mock token validation logic for structure
        // User user = findUserByToken(requestDto.getToken());
        // user.setPasswordHash(passwordEncoder.encode(requestDto.getNewPassword()));
        // userRepository.save(user);
        
        throw new RuntimeException("Reset password functionality not fully implemented yet");
    }

    @Override
    public UserProfileResponseDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("User not found"));
                
        UserProfileResponseDto.UserProfileResponseDtoBuilder builder = UserProfileResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .gender(user.getGender())
                .dob(user.getDob())
                .bloodGroup(user.getBloodGroup())
                .profilePictureUrl(user.getProfilePictureUrl())
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .branch(user.getDepartment() != null ? user.getDepartment().getName() : null);
                
        if (user.getRole() == UserRole.STUDENT) {
            studentRepository.findById(userId).ifPresent(student -> {
                builder.enrollmentNo(student.getEnrollmentNo());
                builder.rollNo(student.getRollNo());
                builder.batchYear(student.getBatchYear());
                builder.admissionYear(student.getAdmissionYear() != null ? student.getAdmissionYear() : student.getBatchYear());
                builder.course(student.getCourse());
                builder.currentSemester(student.getCurrentSemester());
                builder.section(student.getSection());
            });
        }
        
        return builder.build();
    }

    @Override
    @Transactional
    public UserProfileResponseDto updateProfile(UUID userId, UpdateProfileRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("User not found"));
                
        user.setFirstName(requestDto.getFirstName());
        user.setLastName(requestDto.getLastName());
        user.setPhone(requestDto.getPhone());
        user.setGender(requestDto.getGender());
        user.setDob(requestDto.getDob());
        user.setBloodGroup(requestDto.getBloodGroup());
        user.setProfilePictureUrl(requestDto.getProfilePictureUrl());
        
        userRepository.save(user);
        
        if (user.getRole() == UserRole.STUDENT) {
            studentRepository.findById(userId).ifPresent(student -> {
                if (requestDto.getEnrollmentNo() != null) student.setEnrollmentNo(requestDto.getEnrollmentNo());
                if (requestDto.getRollNo() != null) student.setRollNo(requestDto.getRollNo());
                if (requestDto.getBatchYear() != null) student.setBatchYear(requestDto.getBatchYear());
                studentRepository.save(student);
            });
        }
        
        return getUserProfile(userId);
    }

    @Override
    public VerifyAccountResponseDto verifyAccount(VerifyAccountRequestDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("No record found. Please contact your HOD."));

        if (user.getIsActivated() != null && user.getIsActivated()) {
            throw new IllegalStateException("This account already exists. Please login.");
        }

        VerifyAccountResponseDto.VerifyAccountResponseDtoBuilder builder = VerifyAccountResponseDto.builder()
                .email(user.getEmail())
                .name(user.getFirstName() + " " + user.getLastName())
                .role(user.getRole().name())
                .department(user.getDepartment() != null ? user.getDepartment().getName() : null);

        if (user.getRole() == com.acronexus.entity.UserRole.STUDENT) {
            studentRepository.findById(user.getId()).ifPresent(student -> {
                builder.enrollmentNumber(student.getEnrollmentNo());
                builder.batch(student.getBatchYear());
            });
        }

        return builder.build();
    }

    @Override
    @Transactional
    public void activateAccount(ActivateAccountRequestDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("No record found. Please contact your HOD."));

        if (user.getIsActivated() != null && user.getIsActivated()) {
            throw new IllegalStateException("This account already exists. Please login.");
        }

        user.setPasswordHash(passwordEncoder.encode(requestDto.getPassword()));
        user.setIsActivated(true);
        userRepository.save(user);
    }

    @Override
    public com.acronexus.entity.User getUserEntity(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.acronexus.exception.ResourceNotFoundException("User not found"));
    }
}
