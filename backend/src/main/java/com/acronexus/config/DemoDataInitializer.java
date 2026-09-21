package com.acronexus.config;

import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.DepartmentRepository;
import com.acronexus.repository.SubjectRepository;
import com.acronexus.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@Profile("demo")
@RequiredArgsConstructor
@Slf4j
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;
    private final TransactionTemplate transactionTemplate;

    @Override
    public void run(String... args) throws Exception {
        transactionTemplate.execute(status -> {
            log.info("Demo Profile is ACTIVE. Seeding E2E test data...");
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
