package com.springboot.springboot.entity.common;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.springboot.springboot.entity.personne.Etudiant;
import com.springboot.springboot.entity.planning.SessionFormation;

@Entity
@Table(name = "groupe")
public class Groupe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false, unique = true, length = 100)
    private String nom;
    
    @NotBlank(message = "Le code est obligatoire")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Min(value = 0)
    @Column(nullable = false)
    @JsonProperty(access = Access.READ_ONLY)
    private Integer effectif = 0;
    
    @Min(value = 2)
    @Column(name = "effectif_max")
    private Integer effectifMax = 20;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;     

    @ManyToMany(mappedBy = "groupes", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Etudiant> etudiants = new ArrayList<>();
    
    @OneToMany(mappedBy = "groupe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore  // Évite les boucles infinies JSON
    private List<SessionFormation> sessions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructeurs
    public Groupe() {}
    
    public Groupe(Integer id) {
		super();
		this.id = id;
	}

	public Groupe(String code, String nom) {
        this.code = code;
        this.nom = nom;
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

    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }

    public Integer getEffectif() { 
        return effectif; 
    }

    public void setEffectif(Integer effectif) { 
        this.effectif = effectif; 
    }
    
    public Integer getEffectifMax() {
        return effectifMax;
    }
    
    public void setEffectifMax(Integer effectifMax) {
        this.effectifMax = effectifMax;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Etudiant> getEtudiants() {
        return etudiants;
    }

    public void setEtudiants(List<Etudiant> etudiants) {
        this.etudiants = etudiants;
        this.effectif = etudiants != null ? etudiants.size() : 0;
    }
    
    public List<SessionFormation> getSessions() {
        return sessions;
    }
    
    public void setSessions(List<SessionFormation> sessions) {
        this.sessions = sessions;
    }
    
    // Méthodes métier
    public boolean estComplet() {
        return effectif >= effectifMax; 
    }
    
    public void recalculerEffectif() {
        this.effectif = this.etudiants != null ? this.etudiants.size() : 0;
    }
}