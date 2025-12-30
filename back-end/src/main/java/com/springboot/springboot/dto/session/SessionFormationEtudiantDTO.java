package com.springboot.springboot.dto.session;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public class SessionFormationEtudiantDTO {
    public int id;
    public String titre;
    public String description;
    public int duree;
    public String statut;

    @JsonFormat(pattern = "yyyy-MM-dd")  
    public LocalDate dateDebut;

    @JsonFormat(pattern = "yyyy-MM-dd")  
    public LocalDate dateFin;

    public String nomFormateur;
    public String nomGroupe;
}
