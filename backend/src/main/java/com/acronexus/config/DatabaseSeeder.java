package com.acronexus.config;

import com.acronexus.entity.User;
import com.acronexus.entity.UserRole;
import com.acronexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedHodUser();
    }

    private void seedHodUser() {
        String email = "prashant.lakdawala@acropolis.in";
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setFirstName("Prashant");
            user.setLastName("Lakdawala");
            user.setPasswordHash(passwordEncoder.encode("password123"));
            user.setRole(UserRole.HOD);
            user.setIsActivated(true);
            userRepository.save(user);
            System.out.println("HOD default user seeded successfully.");
        }
    }
}
