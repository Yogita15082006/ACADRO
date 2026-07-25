package com.acronexus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyAccountRequestDto {
    @NotBlank
    @Email
    private String email;
}
