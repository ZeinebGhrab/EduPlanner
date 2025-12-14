package com.springboot.springboot.entity.personne;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

import com.springboot.springboot.entity.common.Preference;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.SessionFormation;

@Entity
@Table(name = "formateur")
public class Formateur extends Personne {

    @Column(nullable = false)
    private Boolean actif = true;
    
    // Champs métier
    @NotBlank(message = "La spécialité est obligatoire")
    @Column(length = 100)
    private String specialite;
    
    @NotBlank(message = "La matricule est obligatoire")
    @Column(unique = true, nullable = false, length = 50)
    private String matricule;

    @OneToMany(mappedBy = "formateur", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DisponibiliteFormateur> disponibilites = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    @JsonIgnore
    private List<Preference> preferences = new ArrayList<>();
    
    @OneToMany(mappedBy = "formateur", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<SessionFormation> sessions = new ArrayList<>();

    // Constructeur
    public Formateur() {}
    
    public Formateur(int id) {
  		super(id);
  	}


    // Méthodes métier
    public void ajouterDisponibilite(DisponibiliteFormateur d) { 
        if (d != null && !disponibilites.contains(d)) {
            disponibilites.add(d);
            d.setFormateur(this);
        }
    }

    public void supprimerDisponibilite(int id) { 
        disponibilites.removeIf(d -> d.getId() == id); 
    }

    public boolean estDisponible(Creneau creneau) {
        if (creneau == null) {
            return false;
        }
        return disponibilites.stream().anyMatch(d -> d.couvre(creneau));
    }

    // Getters et Setters - Métier (password hérite de Personne)
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    
    // Getters et Setters - Métier
    public String getSpecialite() { 
        return specialite; 
    }

    public void setSpecialite(String specialite) { 
        this.specialite = specialite; 
    }

    public String getMatricule() { 
        return matricule; 
    }

    public void setMatricule(String matricule) { 
        this.matricule = matricule; 
    }

    public List<DisponibiliteFormateur> getDisponibilites() {
        return disponibilites;
    }

    public void setDisponibilites(List<DisponibiliteFormateur> disponibilites) {
        this.disponibilites = disponibilites;
    }

    public List<Preference> getPreferences() {
        return preferences;
    }

    public void setPreferences(List<Preference> preferences) {
        this.preferences = preferences;
    }

    public List<SessionFormation> getSessions() {
        return sessions;
    }

    public void setSessions(List<SessionFormation> sessions) {
        this.sessions = sessions;
    }
}