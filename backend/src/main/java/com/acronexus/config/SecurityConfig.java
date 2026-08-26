package com.acronexus.config;

import com.acronexus.security.AuthEntryPointJwt;
import com.acronexus.security.AuthTokenFilter;
import com.acronexus.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    
    @org.springframework.beans.factory.annotation.Value("${acronexus.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:5174}")
    private List<String> allowedOrigins;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> 
                        auth.requestMatchers("/api/auth/login").permitAll()
                            .requestMatchers("/api/auth/forgot-password").permitAll()
                            .requestMatchers("/api/auth/reset-password").permitAll()
                            .requestMatchers("/api/auth/verify-account").permitAll()
                            .requestMatchers("/api/auth/activate-account").permitAll()
                            .requestMatchers("/api/auth/**", "/api/public/**", "/api/debug-students").permitAll()
                            .requestMatchers("/api/attendance-dashboard/test/**").permitAll()
                            .requestMatchers("/api/v1/profile/test/**").permitAll()
                            .requestMatchers("/api/events/file/**").permitAll()
                            .requestMatchers("/api/events/banner/**").permitAll()
                            .requestMatchers("/api/v1/bulk-upload/**").permitAll().requestMatchers("/api/exam-results/publish").permitAll().requestMatchers("/api/exam-results/search").permitAll()
                            .requestMatchers("/api/v1/metadata/**").permitAll()
                            .requestMatchers("/api/v1/users/admin-setup").permitAll()
                            .requestMatchers("/api/v1/timetables/*/test-ai-match").permitAll()
                            .requestMatchers("/api/v1/assignments/*/view", "/api/v1/assignments/*/download", "/api/v1/assignments/submissions/*/view", "/api/v1/assignments/submissions/*/download").permitAll()
                            .requestMatchers("/api/v1/resources/download/**").permitAll()
                            .requestMatchers("/api/events/banner/**").permitAll()
                            .requestMatchers("/api/debug-dashboard/**").permitAll()
                            .requestMatchers("/favicon.ico", "/error", "/uploads/**").permitAll()
                            .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins); 
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
