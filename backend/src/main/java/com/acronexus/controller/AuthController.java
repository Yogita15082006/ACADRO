package com.acronexus.controller;

import com.acronexus.dto.*;
import com.acronexus.security.JwtUtils;
import com.acronexus.security.UserDetailsImpl;
import com.acronexus.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto>> authenticateUser(@Valid @RequestBody AuthRequestDto loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        com.acronexus.entity.User userEntity = authService.getUserEntity(userDetails.getId());
        if (userEntity.getIsActivated() == null || !userEntity.getIsActivated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Account not activated. Please create your account first."));
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_STUDENT");

        AuthResponseDto authResponse = AuthResponseDto.builder()
                .token(jwt)
                .id(userDetails.getId())
                .email(userDetails.getUsername())
                .role(role)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequestDto requestDto) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        authService.changePassword(userDetails.getId(), requestDto);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto requestDto) {
        authService.forgotPassword(requestDto);
        return ResponseEntity.ok(ApiResponse.success("Password reset instructions sent (mock)", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequestDto requestDto) {
        authService.resetPassword(requestDto);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @PostMapping("/verify-account")
    public ResponseEntity<ApiResponse<VerifyAccountResponseDto>> verifyAccount(@Valid @RequestBody VerifyAccountRequestDto requestDto) {
        try {
            VerifyAccountResponseDto response = authService.verifyAccount(requestDto);
            return ResponseEntity.ok(ApiResponse.success("Record found", response));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(ApiResponse.error(e.getMessage()));
        } catch (com.acronexus.exception.ResourceNotFoundException e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/activate-account")
    public ResponseEntity<ApiResponse<Void>> activateAccount(@Valid @RequestBody ActivateAccountRequestDto requestDto) {
        try {
            authService.activateAccount(requestDto);
            return ResponseEntity.ok(ApiResponse.success("Account activated successfully", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(ApiResponse.error(e.getMessage()));
        } catch (com.acronexus.exception.ResourceNotFoundException e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfile() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserProfileResponseDto profile = authService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> updateProfile(@Valid @RequestBody UpdateProfileRequestDto requestDto) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserProfileResponseDto updatedProfile = authService.updateProfile(userDetails.getId(), requestDto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedProfile));
    }
}
