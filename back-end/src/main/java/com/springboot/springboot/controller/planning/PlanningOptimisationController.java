package com.springboot.springboot.controller.planning;

import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.service.planning.PlanningOptimisationService;
import com.springboot.springboot.service.planning.PlanningOptimisationService.ResultatOptimisation;
import com.springboot.springboot.service.planning.PlanningService;
import com.springboot.springboot.repository.planning.PlanningRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import com.springboot.springboot.repository.planning.ConflitRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Contrôleur pour la génération automatique et l'optimisation de planning
 * Accessible uniquement aux administrateurs
 * 
 * Fonctionnalités complètes :
 * - Génération automatique avec optimisation
 * - Recommandations d'amélioration
 * - Ré-optimisation d'un planning existant
 * - Statistiques et métriques
 */
@RestController
@RequestMapping("/api/admin/planning/optimisation")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class PlanningOptimisationController {
    
    @Autowired
    private PlanningOptimisationService optimisationService;
    
    @Autowired
    private PlanningService planningService;
    
    @Autowired
    private PlanningRepository planningRepository;
    
    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private ConflitRepository conflitRepository;
    
    /**
     * ========================================================================
     * GÉNÉRATION AUTOMATIQUE DE PLANNING
     * ========================================================================
     */
    @PostMapping("/generer")
    @Transactional
    public ResponseEntity<?> genererPlanningOptimise(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate semaine) {
        
        try {
            // Validation de la date
            if (semaine.isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "La date de la semaine doit être dans le futur ou aujourd'hui",
                    "dateRecue", semaine.toString()
                ));
            }
            
            // Lancer l'algorithme d'optimisation
            ResultatOptimisation resultat = optimisationService.genererPlanningOptimise(semaine);
            
            // Vérification si planning est null
            if (resultat.getPlanning() == null) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(Map.of(
                    "success", false,
                    "message", "Aucun planning n'a pu être généré",
                    "raison", "Aucune session à planifier ou ressources insuffisantes"
                ));
            }
            
            // Construire la réponse complète
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", resultat.getMessage());
            response.put("timestamp", LocalDateTime.now());
            
            // Informations du planning
            response.put("planning", Map.of(
                "id", resultat.getPlanning().getId(),
                "semaine", resultat.getPlanning().getSemaine(),
                "statut", resultat.getPlanning().getStatut(),
                "nbSessions", resultat.getSessionsAssignees().size()
            ));
            
            // Statistiques détaillées
            response.put("statistiques", Map.of(
                "sessionsAssignees", resultat.getSessionsAssignees().size(),
                "sessionsNonAssignees", resultat.getSessionsNonAssignees().size(),
                "tauxReussite", calculerTauxReussite(resultat),
                "scoreGlobal", String.format("%.2f", resultat.getScoreGlobal()),
                "nbConflits", resultat.getNbConflits(),
                "detailsAlgorithme", resultat.getStatistiques()
            ));
            
            // Détails des sessions assignées
            if (!resultat.getSessionsAssignees().isEmpty()) {
                response.put("sessionsAssignees", resultat.getSessionsAssignees().stream()
                    .map(this::mapSessionToResponse)
                    .collect(Collectors.toList())
                );
            }
            
            // Détails des sessions non assignées
            if (!resultat.getSessionsNonAssignees().isEmpty()) {
                response.put("sessionsNonAssignees", resultat.getSessionsNonAssignees().stream()
                    .map(s -> Map.of(
                        "id", s.getId(),
                        "nomCours", s.getNomCours(),
                        "duree", s.getDuree(),
                        "formateur", s.getFormateur() != null ? 
                            s.getFormateur().getNom() + " " + s.getFormateur().getPrenom() : "N/A",
                        "groupe", s.getGroupe() != null ? s.getGroupe().getNom() : "N/A",
                        "raison", diagnostiquerRaisonNonAssignation(s)
                    ))
                    .collect(Collectors.toList())
                );
            }
            
            // Avertissements et recommandations
            List<String> avertissements = genererAvertissements(resultat);
            if (!avertissements.isEmpty()) {
                response.put("avertissements", avertissements);
            }
            
            // Actions suggérées
            response.put("actionsSuggerees", genererActionsSuggerees(resultat));
            
            // Statut HTTP selon le résultat
            HttpStatus status = resultat.getSessionsAssignees().isEmpty() ? 
                HttpStatus.PARTIAL_CONTENT : HttpStatus.OK;
            
            return ResponseEntity.status(status).body(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Paramètres invalides",
                "erreur", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur lors de la génération du planning",
                "erreur", e.getMessage(),
                "type", e.getClass().getSimpleName()
            ));
        }
    }
    
    /**
     * ========================================================================
     * RECOMMANDATIONS D'AMÉLIORATION
     * ========================================================================
     */
    @GetMapping("/recommandations/{planningId}")
    @Transactional
    public ResponseEntity<?> obtenirRecommandations(@PathVariable int planningId) {
        
        try {
            // Récupérer le planning
            Optional<Planning> planningOpt = planningRepository.findById(planningId);
            if (planningOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Planning planning = planningOpt.get();
            
            // Analyser le planning
            Map<String, Object> analyse = analyserPlanning(planning);
            
            // Générer les recommandations
            List<Map<String, Object>> recommandations = genererRecommandations(planning, analyse);
            
            // Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("planningId", planningId);
            response.put("semaine", planning.getSemaine());
            response.put("statut", planning.getStatut());
            response.put("analyse", analyse);
            response.put("recommandations", recommandations);
            response.put("priorite", determinerPrioriteRecommandations(recommandations));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur lors de l'analyse du planning",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * RÉ-OPTIMISATION D'UN PLANNING EXISTANT
     * ========================================================================
     */
    @PostMapping("/reoptimiser/{planningId}")
    @Transactional
    public ResponseEntity<?> reoptimiserPlanning(@PathVariable int planningId) {
        
        try {
            // Récupérer le planning existant
            Optional<Planning> planningOpt = planningRepository.findById(planningId);
            if (planningOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Planning planning = planningOpt.get();
            
            // Vérifier que le planning peut être ré-optimisé
            if ("PUBLIE".equals(planning.getStatut())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Un planning publié ne peut pas être ré-optimisé",
                    "suggestion", "Créez un nouveau planning ou changez le statut"
                ));
            }
            
            // Sauvegarder l'état initial
            Map<String, Object> etatAvant = capturerEtatPlanning(planning);
            
            // Récupérer toutes les sessions du planning
            List<SessionFormation> sessions = planning.getSessions();
            if (sessions.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le planning ne contient aucune session à optimiser"
                ));
            }
            
            // Détacher les sessions du planning pour ré-optimisation
            sessions.forEach(s -> {
                s.setPlanning(null);
                s.setCreneaux(new ArrayList<>());
                sessionRepository.save(s);
            });
            
            // Supprimer l'ancien planning
            planningRepository.delete(planning);
            planningRepository.flush();
            
            // Relancer l'optimisation
            ResultatOptimisation resultat = optimisationService.genererPlanningOptimise(
                planning.getSemaine()
            );
            
            // Comparer les résultats
            Map<String, Object> etatApres = capturerEtatPlanning(resultat.getPlanning());
            Map<String, Object> comparaison = comparerEtats(etatAvant, etatApres);
            
            // Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ré-optimisation terminée avec succès");
            response.put("ancienPlanningId", planningId);
            response.put("nouveauPlanningId", resultat.getPlanning().getId());
            response.put("etatAvant", etatAvant);
            response.put("etatApres", etatApres);
            response.put("comparaison", comparaison);
            response.put("amelioration", determinerAmelioration(comparaison));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur lors de la ré-optimisation",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * STATISTIQUES GLOBALES
     * ========================================================================
     */
    @GetMapping("/statistiques")
    @Transactional
    public ResponseEntity<?> obtenirStatistiquesGlobales() {
        
        try {
            List<Planning> tousLesPlannings = planningRepository.findAll();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPlannings", tousLesP lannings.size());
            stats.put("planningsEnCours", compterParStatut(tousLesPlannings, "EN_COURS"));
            stats.put("planningsValides", compterParStatut(tousLesPlannings, "VALIDE"));
            stats.put("planningsPublies", compterParStatut(tousLesPlannings, "PUBLIE"));
            
            // Statistiques de sessions
            long totalSessions = sessionRepository.count();
            long sessionsAvecPlanning = sessionRepository.findAll().stream()
                .filter(s -> s.getPlanning() != null)
                .count();
            
            stats.put("totalSessions", totalSessions);
            stats.put("sessionsPlannifiees", sessionsAvecPlanning);
            stats.put("sessionsNonPlannifiees", totalSessions - sessionsAvecPlanning);
            
            // Statistiques de conflits
            long totalConflits = conflitRepository.count();
            stats.put("totalConflits", totalConflits);
            
            // Performance moyenne
            if (!tousLesPlannings.isEmpty()) {
                double tauxMoyenReussite = tousLesPlannings.stream()
                    .mapToDouble(p -> {
                        int total = p.getSessions().size();
                        return total > 0 ? (double) p.getSessions().size() / total * 100 : 0;
                    })
                    .average()
                    .orElse(0.0);
                
                stats.put("tauxMoyenReussite", String.format("%.1f%%", tauxMoyenReussite));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "statistiques", stats
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur lors du calcul des statistiques",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * TEST DU SERVICE
     * ========================================================================
     */
    @GetMapping("/test")
    public ResponseEntity<?> testerService() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Service d'optimisation de planning opérationnel");
        response.put("version", "2.0.0");
        response.put("algorithmes", Map.of(
            "heuristique", "Glouton avec scoring multi-critères",
            "backtracking", "Backtracking intelligent avec élagage",
            "optimisationLocale", "Hill climbing avec échanges",
            "generationCreneaux", "Génération automatique dates et heures"
        ));
        response.put("endpoints", Map.of(
            "generer", "POST /api/admin/planning/optimisation/generer?semaine={yyyy-MM-dd}",
            "recommandations", "GET /api/admin/planning/optimisation/recommandations/{id}",
            "reoptimiser", "POST /api/admin/planning/optimisation/reoptimiser/{id}",
            "statistiques", "GET /api/admin/planning/optimisation/statistiques"
        ));
        
        return ResponseEntity.ok(response);
    }
    
    // ========================================================================
    // MÉTHODES UTILITAIRES PRIVÉES
    // ========================================================================
    
    /**
     * Mappe une session vers un format de réponse
     */
    private Map<String, Object> mapSessionToResponse(SessionFormation session) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", session.getId());
        map.put("nomCours", session.getNomCours());
        map.put("duree", session.getDuree());
        
        if (session.getFormateur() != null) {
            map.put("formateur", Map.of(
                "id", session.getFormateur().getId(),
                "nom", session.getFormateur().getNom() + " " + session.getFormateur().getPrenom()
            ));
        }
        
        if (session.getSalle() != null) {
            map.put("salle", Map.of(
                "id", session.getSalle().getId(),
                "nom", session.getSalle().getNom(),
                "capacite", session.getSalle().getCapacite()
            ));
        }
        
        if (session.getGroupe() != null) {
            map.put("groupe", Map.of(
                "id", session.getGroupe().getId(),
                "nom", session.getGroupe().getNom(),
                "effectif", session.getGroupe().getEffectif()
            ));
        }
        
        if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
            map.put("creneaux", session.getCreneaux().stream()
                .map(c -> Map.of(
                    "id", c.getId(),
                    "date", c.getDate(),
                    "jour", c.getJourSemaine(),
                    "heureDebut", c.getHeureDebut(),
                    "heureFin", c.getHeureFin()
                ))
                .collect(Collectors.toList())
            );
        }
        
        return map;
    }
    
    /**
     * Calcule le taux de réussite
     */
    private String calculerTauxReussite(ResultatOptimisation resultat) {
        int total = resultat.getSessionsAssignees().size() + 
                    resultat.getSessionsNonAssignees().size();
        if (total == 0) return "0%";
        
        double taux = (double) resultat.getSessionsAssignees().size() / total * 100;
        return String.format("%.1f%%", taux);
    }
    
    /**
     * Diagnostique pourquoi une session n'a pas été assignée
     */
    private String diagnostiquerRaisonNonAssignation(SessionFormation session) {
        List<String> raisons = new ArrayList<>();
        
        if (session.getFormateur() == null) {
            raisons.add("Aucun formateur assigné");
        } else if (session.getFormateur().getDisponibilites() == null || 
                   session.getFormateur().getDisponibilites().isEmpty()) {
            raisons.add("Formateur sans disponibilités déclarées");
        }
        
        if (session.getGroupe() != null && session.getGroupe().getEffectif() > 50) {
            raisons.add("Groupe trop grand (pas de salle suffisante)");
        }
        
        if (session.getDuree() > 240) {
            raisons.add("Durée trop longue (> 4h)");
        }
        
        return raisons.isEmpty() ? "Ressources insuffisantes" : String.join(", ", raisons);
    }
    
    /**
     * Génère les avertissements
     */
    private List<String> genererAvertissements(ResultatOptimisation resultat) {
        List<String> avertissements = new ArrayList<>();
        
        int total = resultat.getSessionsAssignees().size() + 
                    resultat.getSessionsNonAssignees().size();
        
        if (!resultat.getSessionsNonAssignees().isEmpty()) {
            double tauxEchec = (double) resultat.getSessionsNonAssignees().size() / total * 100;
            if (tauxEchec > 20) {
                avertissements.add(String.format(
                    "⚠️ %.1f%% des sessions n'ont pas pu être assignées", tauxEchec
                ));
            }
        }
        
        if (resultat.getScoreGlobal() < 0.5) {
            avertissements.add("⚠️ Score global faible (< 0.5) - Planning sous-optimal");
        }
        
        if (resultat.getNbConflits() > 0) {
            avertissements.add(String.format(
                "⚠️ %d conflit(s) détecté(s) - Révision nécessaire", 
                resultat.getNbConflits()
            ));
        }
        
        return avertissements;
    }
    
    /**
     * Génère les actions suggérées
     */
    private List<Map<String, String>> genererActionsSuggerees(ResultatOptimisation resultat) {
        List<Map<String, String>> actions = new ArrayList<>();
        
        if (!resultat.getSessionsNonAssignees().isEmpty()) {
            actions.add(Map.of(
                "action", "Ajouter des disponibilités formateurs",
                "raison", "Certaines sessions n'ont pas pu être assignées",
                "impact", "Haut"
            ));
        }
        
        if (resultat.getScoreGlobal() < 0.6) {
            actions.add(Map.of(
                "action", "Définir des préférences pour les formateurs",
                "raison", "Score global faible",
                "impact", "Moyen"
            ));
        }
        
        if (resultat.getNbConflits() == 0 && resultat.getScoreGlobal() > 0.7) {
            actions.add(Map.of(
                "action", "Valider et publier le planning",
                "raison", "Planning de bonne qualité sans conflits",
                "impact", "Recommandé"
            ));
        }
        
        return actions;
    }
    
    /**
     * Analyse un planning existant
     */
    private Map<String, Object> analyserPlanning(Planning planning) {
        Map<String, Object> analyse = new HashMap<>();
        
        List<SessionFormation> sessions = planning.getSessions();
        analyse.put("nbSessions", sessions.size());
        
        // Analyse de la distribution
        Map<String, Long> repartitionJours = sessions.stream()
            .filter(s -> s.getCreneaux() != null && !s.getCreneaux().isEmpty())
            .collect(Collectors.groupingBy(
                s -> s.getCreneaux().get(0).getJourSemaine(),
                Collectors.counting()
            ));
        analyse.put("repartitionJours", repartitionJours);
        
        // Analyse des conflits
        List<Conflit> conflits = planning.getConflits();
        analyse.put("nbConflits", conflits.size());
        
        if (!conflits.isEmpty()) {
            Map<String, Long> typesConflits = conflits.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getType().name(),
                    Collectors.counting()
                ));
            analyse.put("typesConflits", typesConflits);
        }
        
        // Analyse de l'utilisation des ressources
        long sallesUtilisees = sessions.stream()
            .filter(s -> s.getSalle() != null)
            .map(s -> s.getSalle().getId())
            .distinct()
            .count();
        analyse.put("sallesUtilisees", sallesUtilisees);
        
        long formateursUtilises = sessions.stream()
            .filter(s -> s.getFormateur() != null)
            .map(s -> s.getFormateur().getId())
            .distinct()
            .count();
        analyse.put("formateursUtilises", formateursUtilises);
        
        return analyse;
    }
    
    /**
     * Génère des recommandations basées sur l'analyse
     */
    private List<Map<String, Object>> genererRecommandations(Planning planning, Map<String, Object> analyse) {
        List<Map<String, Object>> recommandations = new ArrayList<>();
        
        // Recommandation sur les conflits
        int nbConflits = (int) analyse.get("nbConflits");
        if (nbConflits > 0) {
            recommandations.add(Map.of(
                "type", "CONFLIT",
                "priorite", "HAUTE",
                "titre", "Résoudre les conflits",
                "description", String.format("%d conflit(s) détecté(s) dans le planning", nbConflits),
                "action", "Utiliser l'endpoint de ré-optimisation pour résoudre automatiquement"
            ));
        }
        
        // Recommandation sur la répartition
        @SuppressWarnings("unchecked")
        Map<String, Long> repartition = (Map<String, Long>) analyse.get("repartitionJours");
        if (repartition != null) {
            long max = repartition.values().stream().max(Long::compare).orElse(0L);
            long min = repartition.values().stream().min(Long::compare).orElse(0L);
            
            if (max - min > 5) {
                recommandations.add(Map.of(
                    "type", "EQUILIBRE",
                    "priorite", "MOYENNE",
                    "titre", "Rééquilibrer la distribution des cours",
                    "description", "Certains jours sont surchargés par rapport à d'autres",
                    "action", "Ré-optimiser le planning ou ajuster manuellement"
                ));
            }
        }
        
        // Recommandation sur l'utilisation des ressources
        int nbSessions = (int) analyse.get("nbSessions");
        long sallesUtilisees = (long) analyse.get("sallesUtilisees");
        
        if (sallesUtilisees < 2 && nbSessions > 10) {
            recommandations.add(Map.of(
                "type", "RESSOURCES",
                "priorite", "BASSE",
                "titre", "Sous-utilisation des salles",
                "description", "Très peu de salles utilisées par rapport au nombre de sessions",
                "action", "Vérifier si d'autres salles sont disponibles"
            ));
        }
        
        // Recommandation positive
        if (nbConflits == 0 && nbSessions > 5) {
            recommandations.add(Map.of(
                "type", "SUCCES",
                "priorite", "INFO",
                "titre", "Planning de bonne qualité",
                "description", "Aucun conflit détecté, planning prêt à être validé",
                "action", "Valider et publier le planning"
            ));
        }
        
        return recommandations;
    }
    
    /**
     * Détermine la priorité globale des recommandations
     */
    private String determinerPrioriteRecommandations(List<Map<String, Object>> recommandations) {
        if (recommandations.stream().anyMatch(r -> "HAUTE".equals(r.get("priorite")))) {
            return "HAUTE";
        }
        if (recommandations.stream().anyMatch(r -> "MOYENNE".equals(r.get("priorite")))) {
            return "MOYENNE";
        }
        return "BASSE";
    }
    
    /**
     * Capture l'état d'un planning
     */
    private Map<String, Object> capturerEtatPlanning(Planning planning) {
        Map<String, Object> etat = new HashMap<>();
        etat.put("nbSessions", planning.getSessions().size());
        etat.put("nbConflits", planning.getConflits().size());
        etat.put("statut", planning.getStatut());
        
        // Calculer un score approximatif
        double score = planning.getSessions().size() > 0 ? 
            (double) planning.getSessions().size() / (planning.getSessions().size() + planning.getConflits().size()) : 0;
        etat.put("scoreApproximatif", String.format("%.2f", score));
        
        return etat;
    }
    
    /**
     * Compare deux états de planning
     */
    private Map<String, Object> comparerEtats(Map<String, Object> avant, Map<String, Object> apres) {
        Map<String, Object> comparaison = new HashMap<>();
        
        int nbSessionsAvant = (int) avant.get("nbSessions");
        int nbSessionsApres = (int) apres.get("nbSessions");
        comparaison.put("sessions", Map.of(
            "avant", nbSessionsAvant,
            "apres", nbSessionsApres,
            "difference", nbSessionsApres - nbSessionsAvant
        ));
        
        int nbConflitsAvant = (int) avant.get("nbConflits");
        int nbConflitsApres = (int) apres.get("nbConflits");
        comparaison.put("conflits", Map.of(
            "avant", nbConflitsAvant,
            "apres", nbConflitsApres,
            "difference", nbConflitsApres - nbConflitsAvant
        ));
        
        return comparaison;
    }
    
    /**
     * Détermine si la ré-optimisation a amélioré le planning
     */
    private String determinerAmelioration(Map<String, Object> comparaison) {
        @SuppressWarnings("unchecked")
        Map<String, Integer> conflits = (Map<String, Integer>) comparaison.get("conflits");
        int diffConflits = conflits.get("difference");
        
        @SuppressWarnings("unchecked")
        Map<String, Integer> sessions = (Map<String, Integer>) comparaison.get("sessions");
        int diffSessions = sessions.get("difference");
        
        if (diffConflits < 0 && diffSessions >= 0) {
            return "✅ AMÉLIORATION SIGNIFICATIVE - Moins de conflits";
        } else if (diffSessions > 0) {
            return "✅ AMÉLIORATION - Plus de sessions assignées";
        } else if (diffConflits == 0 && diffSessions == 0) {
            return "➖ STABLE - Aucun";
        }
		return null;
    }
}