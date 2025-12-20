package com.springboot.springboot.dto.admin;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDTO {
    private int id;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private Boolean actif;

    @Builder
    public AdminDTO(int id, String email, String nom, String prenom, String role, Boolean actif) {
        this.setId(id);
        this.setEmail(email);
        this.setNom(nom);
        this.setPrenom(prenom);
        this.setRole(role);
        this.setActif(actif);
    }

	public AdminDTO(Object id2, String email2, String nom2, Object prenom2, String role2, boolean actif2) {
		this.setId((int) id2);
		this.setEmail(email2);
		this.setNom(nom2);
		this.setPrenom((String) prenom2);
		this.setRole(role2);
		this.setActif(actif2);
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getNom() {
		return nom;
	}

	public void setNom(String nom) {
		this.nom = nom;
	}

	public String getPrenom() {
		return prenom;
	}

	public void setPrenom(String prenom) {
		this.prenom = prenom;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public Boolean getActif() {
		return actif;
	}

	public void setActif(Boolean actif) {
		this.actif = actif;
	}
}
