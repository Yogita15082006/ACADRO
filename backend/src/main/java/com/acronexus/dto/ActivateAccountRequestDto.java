package com.acronexus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActivateAccountRequestDto {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;
}
