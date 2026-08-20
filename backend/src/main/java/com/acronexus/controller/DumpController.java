package com.acronexus.controller;

import com.acronexus.entity.Subject;
import com.acronexus.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/public/dump")
@RequiredArgsConstructor
public class DumpController {
    private final SubjectRepository subjectRepository;
    
    @GetMapping("/subjects")
    public List<java.util.Map<String, String>> getSubjects() {
        return subjectRepository.findAll().stream()
            .map(s -> java.util.Map.of("code", s.getCode(), "name", s.getName()))
            .toList();
    }
}
