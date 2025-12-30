package com.springboot.springboot.entity.ressources;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.CreneauIndisponible;

@Entity
@Table(name = "salle")
public class Salle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, unique = true, length = 50)
    private String nom;

    @Column(nullable = false)
    private Integer capacite;

    @Column(length = 100)
    private String batiment;

    @Column(length = 50)
    private String type;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "salle_id")
    private List<CreneauIndisponible> creneauxIndisponibles = new ArrayList<>();

    // Constructeur
    public Salle() {}
    
    

    public Salle(int id) {
		super();
		this.id = id;
	}

	// Méthodes métier
    public boolean estDisponible(Creneau creneau) {
        if (creneau == null) {
            return false;
        }
        return creneauxIndisponibles.stream()
            .noneMatch(c -> c.getCreneau() != null && c.getCreneau().chevauche(creneau));
    }

    public boolean peutAccueillir(Integer nombre) { 
        return capacite != null && nombre != null && capacite >= nombre; 
    }
    
    // Méthodes pour CreneauIndisponible
    public void ajouterCreneauIndisponible(CreneauIndisponible c) {
        if (c != null && !creneauxIndisponibles.contains(c)) {
            creneauxIndisponibles.add(c);
            c.setSalle(this); 
        }
    }

    public void retirerCreneauIndisponible(CreneauIndisponible c) {
        if (c != null && creneauxIndisponibles.contains(c)) {
            creneauxIndisponibles.remove(c);
            c.setSalle(null); 
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

    public Integer getCapacite() { 
        return capacite; 
    }

    public void setCapacite(Integer capacite) { 
        this.capacite = capacite; 
    }

    public String getBatiment() { 
        return batiment; 
    }

    public void setBatiment(String batiment) { 
        this.batiment = batiment; 
    }

    public String getType() { 
        return type; 
    }

    public void setType(String type) { 
        this.type = type; 
    }

    public List<CreneauIndisponible> getCreneauxIndisponibles() {
        return creneauxIndisponibles;
    }

    public void setCreneauxIndisponibles(List<CreneauIndisponible> creneauxIndisponibles) {
        this.creneauxIndisponibles = creneauxIndisponibles;
    }
}