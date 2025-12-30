package com.springboot.springboot.entity.planning;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.ressources.Materiel;
import com.springboot.springboot.entity.ressources.Salle;

@Entity
@Table(name = "session_formation")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SessionFormation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "titre", nullable = false, length = 200)
    private String nomCours;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer duree;

    @Column(length = 50, nullable = false)
    private String statut = "EN_CREATION"; // EN_CREATION, EN_CONFLIT, VALIDE, PLANIFIEE, EN_COURS, TERMINE

    @Column(name = "a_des_conflits", nullable = false)
    private Boolean aDesConflits = false;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    @JsonIgnoreProperties({"sessions", "disponibilites", "preferences"})
    private Formateur formateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salle_id")
    @JsonIgnoreProperties({"equipements", "creneauxIndisponibles"})
    private Salle salle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    @JsonIgnoreProperties({"sessions", "etudiants"})
    private Groupe groupe;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "session_creneau",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "creneau_id")
    )
    private List<Creneau> creneaux = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "session_materiel",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "materiel_id")
    )
    @JsonIgnoreProperties("sessions")
    private List<Materiel> materielRequis = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_id")
    @JsonIgnore
    private Planning planning;

    // Constructeurs
    public SessionFormation() {}

    public SessionFormation(String nomCours, Integer duree, String statut, Formateur formateur,
                            Salle salle, Groupe groupe, LocalDate dateDebut, LocalDate dateFin) {
        this.nomCours = nomCours;
        this.duree = duree;
        this.statut = statut;
        this.formateur = formateur;
        this.salle = salle;
        this.groupe = groupe;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
    }
    
    // ✅ AJOUT : Enum pour les statuts
    public enum StatutSession {
        EN_CREATION,    // Session en cours de création
        EN_CONFLIT,     // Session créée mais avec des conflits
        VALIDE,         // Session validée sans conflits
        PLANIFIEE,      // Session planifiée dans un planning
        EN_COURS,       // Session en cours d'exécution
        TERMINEE,       // Session terminée
        ANNULEE         // Session annulée
    }
    
    // Getters et Setters
    public int getId() { 
        return id; 
    }
    
    public void setId(int id) { 
        this.id = id; 
    }
    
    public String getNomCours() { 
        return nomCours; 
    }
    
    public void setNomCours(String nomCours) { 
        this.nomCours = nomCours; 
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getDuree() { 
        return duree; 
    }
    
    public void setDuree(Integer duree) { 
        this.duree = duree; 
    }
    
    public String getStatut() { 
        return statut; 
    }
    
    public void setStatut(String statut) { 
        this.statut = statut; 
    }
    
    public Boolean getADesConflits() {
        return aDesConflits;
    }
    
    public void setADesConflits(Boolean aDesConflits) {
        this.aDesConflits = aDesConflits;
    }
    
    public Formateur getFormateur() { 
        return formateur; 
    }
    
    public void setFormateur(Formateur formateur) { 
        this.formateur = formateur; 
    }
    
    public Salle getSalle() { 
        return salle; 
    }
    
    public void setSalle(Salle salle) { 
        this.salle = salle; 
    }
    
    public Groupe getGroupe() { 
        return groupe; 
    }
    
    public void setGroupe(Groupe groupe) { 
        this.groupe = groupe; 
    }
    
    public List<Creneau> getCreneaux() { 
        return creneaux; 
    }
    
    public void setCreneaux(List<Creneau> creneaux) { 
        this.creneaux = creneaux; 
    }
    
    public List<Materiel> getMaterielRequis() { 
        return materielRequis; 
    }
    
    public void setMaterielRequis(List<Materiel> materielRequis) { 
        this.materielRequis = materielRequis; 
    }
    
    public Planning getPlanning() { 
        return planning; 
    }
    
    public void setPlanning(Planning planning) { 
        this.planning = planning; 
    }

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
    }
}