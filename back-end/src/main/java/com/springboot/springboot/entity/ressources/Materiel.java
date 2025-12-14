package com.springboot.springboot.entity.ressources;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.springboot.springboot.entity.planning.SessionFormation;

@Entity
@Table(name = "materiel")
public class Materiel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 50)
    private String type;

    @Column(name = "quantite_disponible", nullable = false)
    private Integer quantiteDisponible = 0;

    @Column(length = 50)
    private String etat;

    @ManyToMany(mappedBy = "materielRequis")
    @JsonIgnore
    private List<SessionFormation> sessions = new ArrayList<>();

    // Constructeur
    public Materiel() {}
    
    public Materiel(String nom, String type) {
		super();
		this.nom = nom;
		this.type = type;
	}
    

	public Materiel(String nom, String type, Integer quantiteDisponible) {
		super();
		this.nom = nom;
		this.type = type;
		this.quantiteDisponible = quantiteDisponible;
	}

	public Materiel(String nom, String type, Integer quantiteDisponible, String etat) {
		super();
		this.nom = nom;
		this.type = type;
		this.quantiteDisponible = quantiteDisponible;
		this.etat = etat;
	}


	// Méthodes métier
    public boolean estDisponible(Integer q) { 
        return q != null && quantiteDisponible >= q; 
    }

    public boolean reserver(Integer q) {
        if (estDisponible(q)) {
            quantiteDisponible -= q;
            return true;
        }
        return false;
    }

    public void liberer(Integer q) { 
        if (q != null) {
            quantiteDisponible += q; 
        }
    }

    // Méthodes pour gérer les sessions
    public void ajouterSession(SessionFormation s) {
        if (s != null && !sessions.contains(s)) {
            sessions.add(s);
            s.getMaterielRequis().add(this);
        }
    }

    public void retirerSession(SessionFormation s) {
        if (s != null && sessions.contains(s)) {
            sessions.remove(s);
            s.getMaterielRequis().remove(this);
        }
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

    public String getType() { 
        return type; 
    }

    public void setType(String type) { 
        this.type = type; 
    }

    public Integer getQuantiteDisponible() {
        return quantiteDisponible;
    }

    public void setQuantiteDisponible(Integer quantiteDisponible) {
        this.quantiteDisponible = quantiteDisponible;
    }

    public String getEtat() {
        return etat;
    }

    public void setEtat(String etat) {
        this.etat = etat;
    }

    public List<SessionFormation> getSessions() {
        return sessions;
    }

    public void setSessions(List<SessionFormation> sessions) {
        this.sessions = sessions;
    }
}
