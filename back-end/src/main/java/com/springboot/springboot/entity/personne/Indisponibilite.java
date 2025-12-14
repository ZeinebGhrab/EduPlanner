package com.springboot.springboot.entity.personne;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Entité représentant une indisponibilité (formateur ou étudiant)
 * Utilisée pour déclarer des absences ponctuelles ou urgentes
 */
@Entity
@Table(name = "indisponibilite")
public class Indisponibilite {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    
    // Type de personne concernée: FORMATEUR ou ETUDIANT
    @Column(name = "type_personne", nullable = false, length = 20)
    private String typePersonne;
    
    // ID de la personne concernée (formateur_id ou etudiant_id)
    @Column(name = "personne_id", nullable = false)
    private int personneId;
    
    // Date de l'indisponibilité
    @Column(name = "date_indispo", nullable = false)
    private LocalDate dateIndispo;
    
    // Heure de début de l'indisponibilité
    @Column(name = "heure_debut")
    private LocalTime heureDebut;
    
    // Heure de fin de l'indisponibilité
    @Column(name = "heure_fin")
    private LocalTime heureFin;
    
    // Motif de l'indisponibilité
    @Column(columnDefinition = "TEXT")
    private String motif;
    
    // Statut: EN_ATTENTE, VALIDEE, REFUSEE
    @Column(length = 50)
    private String statut = "EN_ATTENTE";
    
    // Constructeurs
    public Indisponibilite() {}
    
    public Indisponibilite(String typePersonne, int personneId, LocalDate dateIndispo, 
                          LocalTime heureDebut, LocalTime heureFin, String motif) {
        this.typePersonne = typePersonne;
        this.personneId = personneId;
        this.dateIndispo = dateIndispo;
        this.heureDebut = heureDebut;
        this.heureFin = heureFin;
        this.motif = motif;
    }
    
    // Getters et Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public String getTypePersonne() { return typePersonne; }
    public void setTypePersonne(String typePersonne) { this.typePersonne = typePersonne; }
    
    public int getPersonneId() { return personneId; }
    public void setPersonneId(int personneId) { this.personneId = personneId; }
    
    public LocalDate getDateIndispo() { return dateIndispo; }
    public void setDateIndispo(LocalDate dateIndispo) { this.dateIndispo = dateIndispo; }
    
    public LocalTime getHeureDebut() { return heureDebut; }
    public void setHeureDebut(LocalTime heureDebut) { this.heureDebut = heureDebut; }
    
    public LocalTime getHeureFin() { return heureFin; }
    public void setHeureFin(LocalTime heureFin) { this.heureFin = heureFin; }
    
    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }
    
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
