package com.springboot.springboot.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints publics (login pour tous les rôles)
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers("/api/formateur/login").permitAll()
                .requestMatchers("/api/etudiant/login").permitAll()
                
                // Endpoints admin (tous les endpoints nécessitent authentification admin)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/statistiques/**").hasRole("ADMIN")
                
                // Endpoints formateur (authentification formateur requise)
                .requestMatchers("/api/formateur/**").hasRole("FORMATEUR")
                
                // Endpoints étudiant (authentification étudiant requise)
                .requestMatchers("/api/etudiant/**").hasRole("ETUDIANT")
                
                // Tous les autres endpoints sont accessibles pour l'instant
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}