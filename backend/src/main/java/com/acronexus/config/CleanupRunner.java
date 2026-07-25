package com.acronexus.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class CleanupRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public CleanupRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "prashant.lakdawala@acropolis.in";
        try {
            int updated = jdbcTemplate.update("UPDATE file_storage SET uploaded_by = (SELECT id FROM users WHERE email = ?) WHERE uploaded_by IN (SELECT id FROM users WHERE role = 'HOD' AND email != ?)", email, email);
            System.out.println("Reassigned " + updated + " file_storage records.");
            int deleted = jdbcTemplate.update("DELETE FROM users WHERE role = 'HOD' AND email != ?", email);
            System.out.println("Deleted " + deleted + " mock HOD accounts.");
        } catch (Exception e) {
            System.err.println("Cleanup failed: " + e.getMessage());
        }
    }
}
