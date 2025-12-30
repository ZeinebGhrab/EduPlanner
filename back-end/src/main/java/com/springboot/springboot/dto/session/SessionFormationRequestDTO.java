package com.springboot.springboot.dto.session;

import java.time.LocalDate;
import java.util.List;

public class SessionFormationRequestDTO {
    public String nomCours;
    public Integer duree;
    public String statut;
    public String description;
    public int formateurId;
    public int salleId;
    public int groupeId;
    public List<Integer> creneauIds; 
    public int planningId;
    public List<Integer> materielRequisIds;
    public LocalDate dateDebut;
    public LocalDate dateFin;

    // Constructeurs
    public SessionFormationRequestDTO() {}

}
