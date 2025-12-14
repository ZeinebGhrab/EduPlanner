package com.springboot.springboot.entity.personne;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalTime;

import com.springboot.springboot.entity.planning.Creneau;

@Entity
@Table(name = "disponibilite_formateur")
public class DisponibiliteFormateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    @JsonBackReference("formateur-disponibilites") // Évite boucle infinie JSON
    private Formateur formateur;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "jour_semaine", nullable = false, length = 20)
    private JourEnum jourSemaine;
    
    @NotNull
    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;
    
    @NotNull
    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;
    
    @NotNull
    @Column(name = "est_disponible", nullable = false)
    private Boolean estDisponible = true;
    
    public enum JourEnum {
        LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI, DIMANCHE   
    }

    // Constructeurs
    public DisponibiliteFormateur() {}
    
    public DisponibiliteFormateur(Formateur formateur, JourEnum jourSemaine, LocalTime heureDebut, LocalTime heureFin, boolean estDisponible) {
        this.formateur = formateur;
        this.jourSemaine = jourSemaine;
        this.heureDebut = heureDebut;
        this.heureFin = heureFin;
        this.estDisponible = estDisponible;
    }

    // Méthode métier
    public boolean couvre(Creneau c) {
        if (c == null || !estDisponible) {
            return false;
        }
        return c.getJourSemaine() != null 
            && c.getJourSemaine().equals(jourSemaine.name())
            && !c.getHeureDebut().isBefore(heureDebut) 
            && !c.getHeureFin().isAfter(heureFin);
    }

    // Getters et Setters 
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public Formateur getFormateur() { return formateur; }
    public void setFormateur(Formateur formateur) { this.formateur = formateur; }
    public JourEnum getJourSemaine() { return jourSemaine; }
    public void setJourSemaine(JourEnum jourSemaine) { this.jourSemaine = jourSemaine; }
    public LocalTime getHeureDebut() { return heureDebut; }
    public void setHeureDebut(LocalTime heureDebut) { this.heureDebut = heureDebut; }
    public LocalTime getHeureFin() { return heureFin; }
    public void setHeureFin(LocalTime heureFin) { this.heureFin = heureFin; }
    public Boolean getEstDisponible() { return estDisponible; }
    public void setEstDisponible(Boolean estDisponible) { this.estDisponible = estDisponible; }
}