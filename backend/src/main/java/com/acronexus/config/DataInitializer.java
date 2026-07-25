package com.acronexus.config;

import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.acronexus.repository.DepartmentRepository departmentRepository;
    private final com.acronexus.repository.SubjectRepository subjectRepository;
    private final com.acronexus.repository.FacultyRepository facultyRepository;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Override
    public void run(String... args) throws Exception {
        transactionTemplate.execute(status -> {
            String hodEmail = "prashant.lakdawala@acropolis.in";
            Optional<User> existingUser = userRepository.findByEmail(hodEmail);

            if (existingUser.isEmpty()) {
                User hodUser = new User();
                hodUser.setEmail(hodEmail);
                hodUser.setFirstName("Prashant");
                hodUser.setLastName("Lakdawala");
                hodUser.setRole(UserRole.HOD);
                hodUser.setPasswordHash(passwordEncoder.encode("password123"));
                hodUser.setIsActive(true);
                hodUser.setIsActivated(true);
                userRepository.save(hodUser);
                log.info("Default HOD account created successfully.");
            } else {
                User user = existingUser.get();
                if (user.getIsActivated() == null || !user.getIsActivated()) {
                    user.setIsActivated(true);
                }
                user.setRole(UserRole.HOD);
                user.setPasswordHash(passwordEncoder.encode("password123"));
                userRepository.save(user);
                log.info("Default HOD account updated with password123 and marked as activated.");
            }
            
            // Seed test data for E2E Timetable AI Match testing
            seedE2ETestData();
            return null;
        });
    }
    
    private void seedE2ETestData() {
        // Create Department
        com.acronexus.entity.Department dept = departmentRepository.findAll().stream().filter(d -> d.getName().equals("Computer Science")).findFirst().orElseGet(() -> {
            com.acronexus.entity.Department d = new com.acronexus.entity.Department();
            d.setName("Computer Science");
            d.setCode("CS");
            d.setIsActive(true);
            return departmentRepository.save(d);
        });

        // Add Subjects
        String[] subjects = {"Data Structures", "Operating Systems", "DBMS Lab"};
        for (String s : subjects) {
            if (subjectRepository.findAll().stream().noneMatch(sub -> sub.getName().equals(s))) {
                com.acronexus.entity.Subject sub = new com.acronexus.entity.Subject();
                sub.setName(s);
                sub.setCode(s.substring(0, 3).toUpperCase() + "-101");
                sub.setDepartment(dept);
                sub.setIsActive(true);
                subjectRepository.save(sub);
            }
        }
        
        // Add Faculties
        String[][] faculties = {
            {"Dr.", "Smith"},
            {"Prof.", "Johnson"},
            {"Mr.", "White"},
            {"Dr. Alice", "Green"}
        };
        for (String[] f : faculties) {
            if (userRepository.findByEmail(f[1].toLowerCase() + "@acropolis.in").isEmpty()) {
                User u = new User();
                u.setEmail(f[1].toLowerCase() + "@acropolis.in");
                u.setFirstName(f[0]);
                u.setLastName(f[1]);
                u.setRole(UserRole.FACULTY);
                u.setPasswordHash(passwordEncoder.encode("password123"));
                u.setIsActive(true);
                u.setIsActivated(true);
                u = userRepository.save(u);
                
                com.acronexus.entity.Faculty fac = new com.acronexus.entity.Faculty();
                fac.setUser(u);
                fac.setEmployeeId("EMP-" + f[1].toUpperCase());
                fac.setDesignation("Professor");
                fac.setJoiningDate(java.time.LocalDate.now());
                fac.markAsNew();
                facultyRepository.save(fac);
            }
        }
        log.info("E2E Test Data Seeded Successfully.");
    }
}
