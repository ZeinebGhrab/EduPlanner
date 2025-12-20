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
        this.id = id;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.actif = actif;
    }

	public AdminDTO(Object id2, String email2, String nom2, Object prenom2, String role2, boolean actif2) {
		this.id = (int) id2;
		this.email  = email2;
		this.nom = nom2;
		this.prenom = (String) prenom2;
		this.role = role2;
		this.actif = actif2;
	}
}
