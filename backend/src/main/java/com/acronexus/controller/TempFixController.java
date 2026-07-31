package com.acronexus.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;

@RestController
public class TempFixController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/v1/temp-fix")
    public ResponseEntity<?> getMetadata() {
        try {
            return ResponseEntity.ok(jdbcTemplate.queryForList("SELECT cast(id as text) as id, scheme_name, academic_year, batch FROM academic_scheme ORDER BY created_at DESC LIMIT 5"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
