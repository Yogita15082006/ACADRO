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
            
            return null;
        });
    }
}
