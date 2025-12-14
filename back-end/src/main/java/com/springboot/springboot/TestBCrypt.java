package com.springboot.springboot;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestBCrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String rawPassword = "password123";
        String existingHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        
        // Test if existing hash matches password123
        boolean matches = encoder.matches(rawPassword, existingHash);
        System.out.println("Le hash existant correspond à 'password123': " + matches);
        
        // Generate new hash for password123
        String newHash = encoder.encode(rawPassword);
        System.out.println("\nNouveau hash pour 'password123':");
        System.out.println(newHash);
        
        // Verify new hash works
        boolean newMatches = encoder.matches(rawPassword, newHash);
        System.out.println("\nLe nouveau hash fonctionne: " + newMatches);
    }
}
