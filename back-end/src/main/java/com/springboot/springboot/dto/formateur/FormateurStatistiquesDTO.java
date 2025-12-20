package com.springboot.springboot.dto.formateur;

public class FormateurStatistiquesDTO {
    private Long sessionsAVenir;
    private Long sessionsTerminees;
    private Long etudiantsActifs;

    public FormateurStatistiquesDTO() {}

    public FormateurStatistiquesDTO(Long sessionsAVenir, Long sessionsTerminees, Long etudiantsActifs) {
        this.sessionsAVenir = sessionsAVenir;
        this.sessionsTerminees = sessionsTerminees;
        this.etudiantsActifs = etudiantsActifs;
    }

    // Getters et Setters
    public Long getSessionsAVenir() { return sessionsAVenir; }
    public void setSessionsAVenir(Long sessionsAVenir) { this.sessionsAVenir = sessionsAVenir; }

    public Long getSessionsTerminees() { return sessionsTerminees; }
    public void setSessionsTerminees(Long sessionsTerminees) { this.sessionsTerminees = sessionsTerminees; }

    public Long getEtudiantsActifs() { return etudiantsActifs; }
    public void setEtudiantsActifs(Long etudiantsActifs) { this.etudiantsActifs = etudiantsActifs; }
}
