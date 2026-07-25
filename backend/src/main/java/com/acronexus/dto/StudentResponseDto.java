package com.acronexus.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class StudentResponseDto {
    private UUID id;
    private String enrollmentNumber;
    private String name;
    private String gender;
    private String batch;
    private String year;
    private String semester;
    private String className;
    private String status;
    private String avatar;
    private String email;
    private String phone;
}
