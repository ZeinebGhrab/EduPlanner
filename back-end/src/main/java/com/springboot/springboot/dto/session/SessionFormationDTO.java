package com.springboot.springboot.dto.session;

import java.time.LocalDate;
import java.util.List;

public class SessionFormationDTO {
    public String nomCours;
    public int duree;
    public String statut;

    public int formateurId;
    public String formateurNom;

    public int salleId;
    public String salleNom;

    public int groupeId;
    public String groupeNom;

    public List<String> etudiants; 

    public int creneauId;
    public List<String> creneauxHoraires;

    public int planningId;
    public String planningSemaine;

    public List<Integer> materielRequisIds;
    public List<String> materielRequisNoms;
    private Integer id;
	public LocalDate date;
    
	public void setId(int id2) {
		id = id2;
		
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}
}

