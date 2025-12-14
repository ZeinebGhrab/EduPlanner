package com.springboot.springboot.entity.planning;

import jakarta.persistence.*;

import com.springboot.springboot.entity.ressources.Salle;

@Entity
@Table(name = "creneau_indisponible")
public class CreneauIndisponible {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "creneau_id")
    private Creneau creneau;

    @Column(columnDefinition = "TEXT")
    private String raison;

    @Column(length = 50)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salle_id")
    private Salle salle;

    // Constructeur
    public CreneauIndisponible() {}

    // Getters et Setters
    public int getId() { 
        return id; 
    }

    public void setId(int id) { 
        this.id = id; 
    }

    public Creneau getCreneau() { 
        return creneau; 
    }

    public void setCreneau(Creneau creneau) { 
        this.creneau = creneau; 
    }

    public String getRaison() {
        return raison;
    }

    public void setRaison(String raison) {
        this.raison = raison;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Salle getSalle() {
        return salle;
    }

    public void setSalle(Salle salle) {
        this.salle = salle;
    }
}
