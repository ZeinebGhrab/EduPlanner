package com.springboot.springboot.entity.common;

import com.springboot.springboot.entity.personne.Etudiant;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "preference")
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypePreference type;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Min(value = 1)
    @Column(nullable = false)
    private Integer priorite = 1;

    @Column(length = 255)
    private String valeur;
    
    @ManyToOne
    @JoinColumn(name = "etudiant_id")
    @JsonBackReference("etudiant-preferences")  // Évite boucle JSON
    private Etudiant etudiant;

    @ManyToOne
    @JoinColumn(name = "formateur_id")
    @JsonBackReference("formateur-preferences")  
    private Formateur formateur;
    
    public enum TypePreference {
        JOUR, HORAIRE, SALLE      
    }

    public Preference() {}

    public Preference(TypePreference type, String description, Integer priorite, String valeur) {
        this.type = type;
        this.description = description;
        this.priorite = priorite;
        this.valeur = valeur;
    }

    // Méthode métier
    public int evaluer(SessionFormation s) { 
        return 1; 
    }

    // Getters et Setters (tous)
    public int getId() { 
    	return id; 
    }
    
    public void setId(int id) { 
    	this.id = id; 
    }
    
    public TypePreference getType() { 
    	return type;
    }
    
    public void setType(TypePreference type) { 
    	this.type = type; 
    }
    
    public String getDescription() { 
    	return description; 
    }
    
    public void setDescription(String description) { 
    	this.description = description; 
    }
    
    public Integer getPriorite() { 
    	return priorite; 
    }
    
    public void setPriorite(Integer priorite) { 
    	this.priorite = priorite; 
    }
    
    public String getValeur() { 
    	return valeur; 
    }
    
    public void setValeur(String valeur) { 
    	this.valeur = valeur; 
    }
    
    public Etudiant getEtudiant() { 
    	return etudiant; 
    }
    
    public void setEtudiant(Etudiant etudiant) { 
    	this.etudiant = etudiant; 
    }
    
    public Formateur getFormateur() { 
    	return formateur; 
    }
    
    public void setFormateur(Formateur formateur) { 
    	this.formateur = formateur; 
    }
}
