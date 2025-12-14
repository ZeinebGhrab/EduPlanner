package com.springboot.springboot.service.admin;

import com.springboot.springboot.dto.admin.DashboardDTO;
import com.springboot.springboot.dto.admin.StatistiquesDTO;
import com.springboot.springboot.entity.admin.Statistiques;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.repository.admin.StatistiquesRepository;
import com.springboot.springboot.repository.common.GroupeRepository;
import com.springboot.springboot.repository.personne.EtudiantRepository;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.planning.ConflitRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import com.springboot.springboot.repository.ressources.SalleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatistiquesService {
    
    @Autowired
    private StatistiquesRepository statistiquesRepository;
    
    @Autowired
    private SalleRepository salleRepository;
    
    @Autowired
    private EtudiantRepository etudiantRepository;
    
    @Autowired
    private FormateurRepository formateurRepository;
    
    @Autowired
    private GroupeRepository groupeRepository;
    
    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private ConflitRepository conflitRepository;
    
    /**
     * Génère toutes les statistiques et les sauvegarde dans la BD
     */
    public void genererToutesStatistiques() {
        saveStatistique("TOTAL_SALLES", (int) salleRepository.count(), "Nombre total de salles");
        saveStatistique("TOTAL_ETUDIANTS", (int) etudiantRepository.count(), "Nombre total d'étudiants");
        saveStatistique("TOTAL_FORMATEURS", (int) formateurRepository.count(), "Nombre total de formateurs");
        saveStatistique("TOTAL_GROUPES", (int) groupeRepository.count(), "Nombre total de groupes");
        saveStatistique("TOTAL_SESSIONS", (int) sessionRepository.count(), "Nombre total de sessions");
        saveStatistique("TOTAL_CONFLITS", (int) conflitRepository.count(), "Nombre total de conflits détectés");
    }
    
    /**
     * Récupère le dashboard avec toutes les statistiques
     */
    public DashboardDTO getDashboard() {
        // Générer les statistiques à jour
        genererToutesStatistiques();
        
        return DashboardDTO.builder()
                .totalSalles((int) salleRepository.count())
                .totalEtudiants((int) etudiantRepository.count())
                .totalFormateurs((int) formateurRepository.count())
                .totalGroupes((int) groupeRepository.count())
                .totalSessions((int) sessionRepository.count())
                .totalConflits((int) conflitRepository.count())
                .etudiantsParGroupe(getEtudiantsParGroupe())
                .joursParSession(getJoursParSession())
                .build();
    }
    
    /**
     * Nombre d'étudiants par groupe
     */
    public Map<Integer, Integer> getEtudiantsParGroupe() {
        return groupeRepository.findAll().stream()
                .collect(Collectors.toMap(
                        groupe -> groupe.getId(),
                        groupe -> groupe.getEtudiants() != null ? groupe.getEtudiants().size() : 0
                ));
    }
    
    /**
     * Nombre de jours pour chaque session
     */
    public Map<Integer, Integer> getJoursParSession() {
        Map<Integer, Integer> joursParSession = new HashMap<>();
        
        for (SessionFormation session : sessionRepository.findAll()) {
            if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
                // Récupérer toutes les dates distinctes
                Set<LocalDate> dates = session.getCreneaux().stream()
                        .map(creneau -> creneau.getDate())
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
                
                joursParSession.put(session.getId(), dates.size());
            } else {
                joursParSession.put(session.getId(), 0);
            }
        }
        
        return joursParSession;
    }
    
    /**
     * Récupère toutes les statistiques
     */
    public List<StatistiquesDTO> findAll() {
        return statistiquesRepository.findAllOrderByDateDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupère les statistiques par type
     */
    public List<StatistiquesDTO> findByType(String type) {
        return statistiquesRepository.findByTypeStat(type).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupère la dernière statistique d'un type donné
     */
    public Optional<StatistiquesDTO> getLatestByType(String type) {
        return statistiquesRepository.findFirstByTypeStatOrderByDateCalculDesc(type)
                .map(this::toDTO);
    }
    
    /**
     * Sauvegarde une statistique
     */
    public StatistiquesDTO saveStatistique(String type, Integer valeur, String description) {
        Statistiques stat = Statistiques.builder()
                .typeStat(type)
                .valeurNumerique(valeur)
                .dateCalcul(LocalDateTime.now())
                .description(description)
                .build();
        
        return toDTO(statistiquesRepository.save(stat));
    }
    
    /**
     * Supprime une statistique
     */
    public void deleteById(int id) {
        statistiquesRepository.deleteById(id);
    }
    
    private StatistiquesDTO toDTO(Statistiques stat) {
        return StatistiquesDTO.builder()
                .id(stat.getId())
                .typeStat(stat.getTypeStat())
                .valeurNumerique(stat.getValeurNumerique())
                .valeurDecimal(stat.getValeurDecimal())
                .valeurTexte(stat.getValeurTexte())
                .dateCalcul(stat.getDateCalcul())
                .description(stat.getDescription())
                .build();
    }
}
