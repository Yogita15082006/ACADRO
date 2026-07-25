package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyAccountResponseDto {
    private String name;
    private String role;
    private String enrollmentNumber;
    private String empId;
    private String batch;
    private String className;
    private String department;
    private String email;
}
