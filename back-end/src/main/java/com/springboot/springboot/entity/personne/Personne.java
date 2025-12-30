package com.springboot.springboot.entity.personne;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@MappedSuperclass
public abstract class Personne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    
    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false, length = 100)
    private String nom;
    
    @NotBlank(message = "Le prenom est obligatoire")
    @Column(nullable = false, length = 100)
    private String prenom;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @NotBlank(message = "Le telephone est obligatoire")
    @Column(unique = true, nullable = false, length = 20)
    private String telephone;

    @Column(name = "date_inscription")
    private LocalDateTime dateInscription;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleEnum role;
    
    @Column(name = "password", nullable = false, length = 255)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    protected String password;
    
    
    public enum RoleEnum {
        FORMATEUR,  
        ETUDIANT,   
        ADMIN       
    }
    
    
    @PrePersist
    protected void onCreate() {
        this.dateInscription = LocalDateTime.now();
        
        // Définir le rôle selon le type d'entité
        if (this.role == null) {
            if (this instanceof Formateur) {
                this.role = RoleEnum.FORMATEUR;
            } else if (this instanceof Etudiant) {
                this.role = RoleEnum.ETUDIANT;
            } else {
                this.role = RoleEnum.ADMIN;
            }
        }
    }

    // Constructeur
    public Personne() {}
    
    

    public Personne(int id) {
		super();
		this.id = id;
	}

	// Méthodes métier
    public String getNomComplet() { 
        return nom + " " + prenom; 
    }

    public boolean validerEmail() { 
        return email != null && email.contains("@"); 
    }

    // Getters et Setters
    public int getId() { 
        return id; 
    }

    public void setId(int id) { 
        this.id = id; 
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public LocalDateTime getDateInscription() {
        return dateInscription;
    }

    public void setDateInscription(LocalDateTime dateInscription) {
        this.dateInscription = dateInscription;
    }
    
    public RoleEnum getRole() {
        return role;
    }

    public void setRole(RoleEnum role) {
        this.role = role;
    }
    
    public String getPassword() {
        return password;
    }
    
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    
    // Setter avec hachage 
    public void setPassword(String password) {
        // Ne rien faire si le mot de passe est null ou vide (pour les updates)
        if (password == null || password.isEmpty()) {
            return;
        }
        
        // Vérifier si déjà haché (commence par $2a$ ou $2b$)
        if (!password.startsWith("$2a$") && !password.startsWith("$2b$")) {
            this.password = encoder.encode(password);
        } else {
            this.password = password;
        }
    }

    // Vérification du mot de passe
    public boolean verifierMotDePasse(String motDePasseClair) {
        return encoder.matches(motDePasseClair, this.password);
    }
}