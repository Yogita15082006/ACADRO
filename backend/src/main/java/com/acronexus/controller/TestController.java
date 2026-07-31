package com.acronexus.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@RestController
public class TestController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/test-metadata")
    public List<Map<String, Object>> testMetadata() {
        return jdbcTemplate.queryForList("SELECT ai_metadata, parsed_content FROM file_storage WHERE file_type='SCHEME' LIMIT 2");
    }
}
