package com.springboot.springboot.dto.salle;

import java.util.List;

public class SalleDTO {
    public int id;
    public String nom;
    public int capacite;
    public String batiment;
    public String type;
    public List<String> equipements; 

    public SalleDTO() {}

    public SalleDTO(int id, String nom, int capacite, String batiment, String type, List<String> equipements) {
        this.id = id;
        this.nom = nom;
        this.capacite = capacite;
        this.batiment = batiment;
        this.type = type;
        this.equipements = equipements;
    }
}