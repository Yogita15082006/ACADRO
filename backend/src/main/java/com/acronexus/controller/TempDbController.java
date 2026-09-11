package com.acronexus.controller;

import com.acronexus.entity.AcroClass;
import com.acronexus.repository.AcroClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TempDbController {

    @Autowired
    private com.acronexus.repository.StudentEnrollmentRepository enrollmentRepository;

}