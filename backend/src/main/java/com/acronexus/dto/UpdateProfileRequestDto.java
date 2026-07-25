package com.acronexus.dto;

import com.acronexus.entity.BloodGroup;
import com.acronexus.entity.Gender;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProfileRequestDto {
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    private String phone;
    private Gender gender;
    private LocalDate dob;
    private BloodGroup bloodGroup;
    private String profilePictureUrl;
    
    // Student specific fields
    private String enrollmentNo;
    private String rollNo;
    private String batchYear;
}
