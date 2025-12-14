package com.springboot.springboot.dto.admin;

import lombok.*;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    private int totalSalles;
    private int totalEtudiants;
    private int totalFormateurs;
    private int totalGroupes;
    private int totalSessions;
    private int totalConflits;
    private Map<Integer, Integer> etudiantsParGroupe; // groupeId -> nombre d'étudiants
    private Map<Integer, Integer> joursParSession; // sessionId -> nombre de jours
}
