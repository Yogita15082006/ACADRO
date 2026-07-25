package com.acronexus.service;

import com.acronexus.dto.*;
import java.util.UUID;

public interface AuthService {
    void changePassword(UUID userId, ChangePasswordRequestDto requestDto);
    void forgotPassword(ForgotPasswordRequestDto requestDto);
    void resetPassword(ResetPasswordRequestDto requestDto);
    UserProfileResponseDto getUserProfile(UUID userId);
    UserProfileResponseDto updateProfile(UUID userId, UpdateProfileRequestDto requestDto);
    VerifyAccountResponseDto verifyAccount(VerifyAccountRequestDto requestDto);
    void activateAccount(ActivateAccountRequestDto requestDto);
    com.acronexus.entity.User getUserEntity(UUID userId);
}
