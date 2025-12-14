package com.springboot.springboot.dto.session;

import java.util.List;

public class SessionFormationRequestDTO {
    public String nomCours;
    public Integer duree;
    public String statut;
    public int formateurId;
    public int salleId;
    public int groupeId;
    public List<Integer> creneauIds; // Changé de creneauId à creneauIds (liste)
    public int planningId;
    public List<Integer> materielRequisIds;

    // Constructeurs
    public SessionFormationRequestDTO() {}

    // Getters/Setters (optionnel si champs publics)
}
