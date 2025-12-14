package com.springboot.springboot.entity.planning;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.springboot.springboot.entity.contraintes.Contrainte;

@Entity
@Table(name = "planning")
public class Planning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private LocalDate semaine;

    @Column(length = 50)
    private String statut; // EN_COURS, VALIDE, PUBLIE
    
    @Column(name = "date_validation")
    private LocalDate dateValidation;
    
    @Column(name = "date_publication")
    private LocalDate datePublication;
    
    @Column(name = "valide_par")
    private String validePar; // username de l'admin qui a validé

    @OneToMany(mappedBy = "planning", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<SessionFormation> sessions = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Conflit> conflits = new ArrayList<>();

    public Planning() {}
    
    

    public Planning(String statut) {
		super();
		this.statut = statut;
	}



	public boolean ajouterSessionAvecContraintes(SessionFormation session, List<Contrainte> contraintes) {
        List<Conflit> conflitsLocales = new ArrayList<>();
        session.setPlanning(this);

        for (Contrainte c : contraintes) {
            if (!c.verifier(session)) {
                Conflit conflit = new Conflit();
                try {
                    conflit.setType(Conflit.TypeConflit.valueOf(c.getClass().getSimpleName().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    conflit.setType(Conflit.TypeConflit.CONTRAINTE_NON_RESPECTEE);
                }
                conflit.setDescription(c.getDescription());
                conflit.setSeverite(c.getSeverite());
                conflit.setSessionsImpliquees(List.of(session));
                conflitsLocales.add(conflit);
            }
        }

        if (!conflitsLocales.isEmpty()) {
            conflits.addAll(conflitsLocales);
            return false;
        }

        sessions.add(session);
        return true;
    }

    // Getters & Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public LocalDate getSemaine() { return semaine; }
    public void setSemaine(LocalDate semaine) { this.semaine = semaine; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public LocalDate getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDate dateValidation) { this.dateValidation = dateValidation; }
    public LocalDate getDatePublication() { return datePublication; }
    public void setDatePublication(LocalDate datePublication) { this.datePublication = datePublication; }
    public String getValidePar() { return validePar; }
    public void setValidePar(String validePar) { this.validePar = validePar; }
    public List<SessionFormation> getSessions() { return sessions; }
    public void setSessions(List<SessionFormation> sessions) { this.sessions = sessions; }
    public List<Conflit> getConflits() { return conflits; }
    public void setConflits(List<Conflit> conflits) { this.conflits = conflits; }
    
    /** Méthode pour détecter tous les conflits d'une liste de contraintes */
    public void detecterTousConflits(List<Contrainte> contraintes) {
        conflits.clear(); // on réinitialise la liste des conflits

        for (SessionFormation session : sessions) {
            for (Contrainte c : contraintes) {
                if (!c.verifier(session)) {
                    Conflit conflit = new Conflit();

                    // Définir le type de conflit selon la contrainte
                    try {
                        conflit.setType(Conflit.TypeConflit.valueOf(c.getClass().getSimpleName().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        conflit.setType(Conflit.TypeConflit.CONTRAINTE_NON_RESPECTEE);
                    }

                    conflit.setDescription(c.getDescription());
                    conflit.setSeverite(c.getSeverite());
                    conflit.setSessionsImpliquees(List.of(session));

                    conflits.add(conflit);
                }
            }
        }
    }
    
    public void supprimerSession(SessionFormation session) {
        sessions.remove(session);
        // Supprimer les conflits liés à cette session
        conflits.removeIf(conflit -> conflit.getSessionsImpliquees().contains(session));
    }

}
