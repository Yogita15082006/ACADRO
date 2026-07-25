package com.acronexus.dto;

import com.acronexus.entity.BloodGroup;
import com.acronexus.entity.Gender;
import com.acronexus.entity.UserRole;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UserResponseDto {
    private UUID id;
    private String email;
    private UserRole role;
    private String firstName;
    private String lastName;
    private String name; // computed: firstName + " " + lastName
    private String phone;
    private Gender gender;
    private LocalDate dob;
    private BloodGroup bloodGroup;
    private String profilePictureUrl;
    private Boolean isActive;
    
    // Faculty-specific fields returned alongside user data
    private String designation;
    private String employeeId;
    private String qualification;
    private Integer experienceYears;
    
    // Department info
    private DepartmentInfo department;
    
    @Data
    public static class DepartmentInfo {
        private UUID id;
        private String name;
    }
}
