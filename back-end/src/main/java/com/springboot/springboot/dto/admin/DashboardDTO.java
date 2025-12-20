package com.springboot.springboot.dto.admin;

import java.util.Map;

public class DashboardDTO {

    private int totalSalles;
    private int totalEtudiants;
    private int totalFormateurs;
    private int totalGroupes;
    private int totalSessions;
    private int totalConflits;
    private Map<Integer, Integer> etudiantsParGroupe; // groupeId -> nombre d'étudiants
    private Map<Integer, Integer> joursParSession;   // sessionId -> nombre de jours

    // Constructeur par défaut
    public DashboardDTO() {}

    // Constructeur complet
    public DashboardDTO(int totalSalles, int totalEtudiants, int totalFormateurs,
                        int totalGroupes, int totalSessions, int totalConflits,
                        Map<Integer, Integer> etudiantsParGroupe,
                        Map<Integer, Integer> joursParSession) {
        this.totalSalles = totalSalles;
        this.totalEtudiants = totalEtudiants;
        this.totalFormateurs = totalFormateurs;
        this.totalGroupes = totalGroupes;
        this.totalSessions = totalSessions;
        this.totalConflits = totalConflits;
        this.etudiantsParGroupe = etudiantsParGroupe;
        this.joursParSession = joursParSession;
    }

    // Getters et Setters
    public int getTotalSalles() { return totalSalles; }
    public void setTotalSalles(int totalSalles) { this.totalSalles = totalSalles; }

    public int getTotalEtudiants() { return totalEtudiants; }
    public void setTotalEtudiants(int totalEtudiants) { this.totalEtudiants = totalEtudiants; }

    public int getTotalFormateurs() { return totalFormateurs; }
    public void setTotalFormateurs(int totalFormateurs) { this.totalFormateurs = totalFormateurs; }

    public int getTotalGroupes() { return totalGroupes; }
    public void setTotalGroupes(int totalGroupes) { this.totalGroupes = totalGroupes; }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }

    public int getTotalConflits() { return totalConflits; }
    public void setTotalConflits(int totalConflits) { this.totalConflits = totalConflits; }

    public Map<Integer, Integer> getEtudiantsParGroupe() { return etudiantsParGroupe; }
    public void setEtudiantsParGroupe(Map<Integer, Integer> etudiantsParGroupe) { this.etudiantsParGroupe = etudiantsParGroupe; }

    public Map<Integer, Integer> getJoursParSession() { return joursParSession; }
    public void setJoursParSession(Map<Integer, Integer> joursParSession) { this.joursParSession = joursParSession; }
}
