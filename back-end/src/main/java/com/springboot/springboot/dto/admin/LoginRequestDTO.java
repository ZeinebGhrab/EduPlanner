package com.springboot.springboot.dto.admin;

/**
 * DTO pour les requêtes de login
 * Utilisé par Admin, Formateur et Étudiant
 * Authentification par email et mot de passe
 */
public class LoginRequestDTO {
    
    private String email;
    private String password;
    
    // Constructeurs
    public LoginRequestDTO() {}
    
    public LoginRequestDTO(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    // Getters et Setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
}
