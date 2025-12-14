package com.springboot.springboot.dto.admin;

/**
 * DTO pour les réponses de login
 * Contient le token JWT et les informations de l'utilisateur
 */
public class LoginResponseDTO {
    
    private String token;
    private String username;
    private String role;
    
    // Constructeurs
    public LoginResponseDTO() {}
    
    public LoginResponseDTO(String token, String username, String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }
    
    // Getters et Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
}
