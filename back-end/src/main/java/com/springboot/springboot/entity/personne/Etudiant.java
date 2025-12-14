package com.springboot.springboot.entity.personne;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.common.Preference;

@Entity
@Table(name = "etudiant")
public class Etudiant extends Personne {
    
    @Column(nullable = false)
    private Boolean actif = true;
    
    // Champs métier
    @NotBlank(message = "La matricule est obligatoire")
    @Column(unique = true, nullable = false, length = 50)
    private String matricule;
    
    @NotBlank(message = "Le niveau est obligatoire")
    @Column(length = 50)
    private String niveau;

    // ✅ Changé LAZY en EAGER pour éviter LazyInitializationException
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "etudiant_groupe",
        joinColumns = @JoinColumn(name = "etudiant_id"),
        inverseJoinColumns = @JoinColumn(name = "groupe_id")
    )
    private List<Groupe> groupes = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id")
    @JsonIgnore  
    private List<Preference> preferences = new ArrayList<>();

    // Constructeur
    public Etudiant() {}

    // Méthodes métier
    public void ajouterAuGroupe(Groupe g) {
        if (g != null && !groupes.contains(g)) {
            groupes.add(g);
            g.getEtudiants().add(this);
        }
    }

    public void retirerDuGroupe(Groupe g) { 
        if (g != null && groupes.contains(g)) {
            groupes.remove(g);
            g.getEtudiants().remove(this);
        }
    }

    public boolean estCompatibleAvec(Etudiant e) { 
        return true; 
    }

    // Getters et Setters - Métier (password hérite de Personne)
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    
    // Getters et Setters - Métier
    public String getMatricule() { 
        return matricule; 
    }
    
    public void setMatricule(String matricule) { 
        this.matricule = matricule; 
    }
    
    public String getNiveau() { 
        return niveau; 
    }
    
    public void setNiveau(String niveau) { 
        this.niveau = niveau; 
    }
    
    public List<Groupe> getGroupes() { 
        return groupes; 
    }
    
    public void setGroupes(List<Groupe> groupes) { 
        this.groupes = groupes; 
    }
    
    public List<Preference> getPreferences() { 
        return preferences; 
    }
    
    public void setPreferences(List<Preference> preferences) { 
        this.preferences = preferences; 
    }
}