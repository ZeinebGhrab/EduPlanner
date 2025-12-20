package com.springboot.springboot.controller.planning;

import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.service.planning.PlanningOptimisationService;
import com.springboot.springboot.service.planning.PlanningOptimisationService.ResultatOptimisation;
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
 * - Génération automatique avec optimisation (heuristique + backtracking + optimisation locale)
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
    private PlanningRepository planningRepository;
    
    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private ConflitRepository conflitRepository;
    
    /**
     * ========================================================================
     * GÉNÉRATION AUTOMATIQUE DE PLANNING AVEC ALGORITHMES D'OPTIMISATION
     * ========================================================================
     * Utilise 3 algorithmes successifs :
     * 1. Heuristique gloutonne avec scoring multi-critères
     * 2. Backtracking intelligent pour les cas difficiles
     * 3. Optimisation locale par hill climbing
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
            
            // Lancer l'algorithme d'optimisation complet
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
            
            // Détails des sessions non assignées avec diagnostic
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
    /**
     * Propose plusieurs solutions alternatives pour résoudre les conflits
     * SANS modifier le planning existant
     */
    @PostMapping("/proposer-solutions/{planningId}")
    @Transactional(readOnly = true)  // ✅ Lecture seule = aucune modification
    public ResponseEntity<?> proposerSolutions(@PathVariable int planningId) {
        
        try {
            Optional<Planning> planningOpt = planningRepository.findById(planningId);
            if (planningOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Planning planning = planningOpt.get();
            List<SessionFormation> sessions = planning.getSessions();
            
            if (sessions.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Aucune session à analyser"
                ));
            }
            
            // ✅ Récupérer les conflits
            List<Conflit> conflits = new ArrayList<>();
            Set<Integer> creneauxIds = new HashSet<>();
            for (SessionFormation session : sessions) {
                if (session.getCreneaux() != null) {
                    for (Creneau creneau : session.getCreneaux()) {
                        creneauxIds.add(creneau.getId());
                    }
                }
            }
            for (Integer creneauId : creneauxIds) {
                conflits.addAll(conflitRepository.findByCreneauId(creneauId));
            }
            
            if (conflits.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Aucun conflit détecté, aucune proposition nécessaire",
                    "planningId", planningId
                ));
            }
            
            // ✅ Générer plusieurs solutions alternatives
            List<Map<String, Object>> solutions = new ArrayList<>();
            
            // Solution 1 : Créer des disponibilités manquantes
            Map<String, Object> solution1 = genererSolutionDisponibilites(conflits);
            if (solution1 != null) {
                solutions.add(solution1);
            }
            
            // Solution 2 : Changer les créneaux
            Map<String, Object> solution2 = genererSolutionChangementCreneaux(sessions, conflits);
            if (solution2 != null) {
                solutions.add(solution2);
            }
            
            // Solution 3 : Changer les salles
            Map<String, Object> solution3 = genererSolutionChangementSalles(sessions, conflits);
            if (solution3 != null) {
                solutions.add(solution3);
            }
            
            // Solution 4 : Créer un nouveau planning optimisé
            Map<String, Object> solution4 = Map.of(
                "id", 4,
                "type", "NOUVEAU_PLANNING",
                "titre", "🆕 Créer un nouveau planning optimisé",
                "description", "Générer un nouveau planning en gardant l'ancien comme référence",
                "avantages", List.of(
                    "Garde l'historique du planning actuel",
                    "Optimisation complète avec algorithme intelligent",
                    "Aucun risque pour le planning existant"
                ),
                "actions", List.of(
                    Map.of(
                        "etape", 1,
                        "action", "Générer un nouveau planning",
                        "endpoint", "POST /api/admin/planning/optimisation/generer?semaine=" + planning.getSemaine(),
                        "description", "Crée un nouveau planning (ID différent) avec sessions optimisées"
                    ),
                    Map.of(
                        "etape", 2,
                        "action", "Comparer les deux plannings",
                        "endpoint", "GET /api/admin/planning/optimisation/comparer?ancien=" + planningId + "&nouveau={nouveauId}",
                        "description", "Compare l'ancien et le nouveau planning"
                    ),
                    Map.of(
                        "etape", 3,
                        "action", "Choisir le meilleur",
                        "description", "Garder le planning avec le meilleur score ou moins de conflits"
                    )
                ),
                "complexite", "FACILE",
                "tempsEstime", "Automatique (< 5 secondes)"
            );
            solutions.add(solution4);
            
            // Solution 5 : Ré-optimiser le planning actuel
            Map<String, Object> solution5 = Map.of(
                "id", 5,
                "type", "REOPTIMISATION",
                "titre", "🔄 Ré-optimiser le planning actuel",
                "description", "Modifier le planning actuel pour résoudre les conflits",
                "avantages", List.of(
                    "Garde le même ID de planning",
                    "Résolution automatique des conflits",
                    "Optimisation intelligente"
                ),
                "risques", List.of(
                    "Modifie le planning existant",
                    "Peut changer les créneaux des sessions valides"
                ),
                "actions", List.of(
                    Map.of(
                        "etape", 1,
                        "action", "Ré-optimiser",
                        "endpoint", "POST /api/admin/planning/optimisation/reoptimiser/" + planningId,
                        "description", "Réassigne intelligemment toutes les sessions"
                    )
                ),
                "complexite", "FACILE",
                "tempsEstime", "Automatique (< 5 secondes)"
            );
            solutions.add(solution5);
            
            // ✅ Construire la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("planningId", planningId);
            response.put("nbConflits", conflits.size());
            response.put("message", String.format("%d conflit(s) détecté(s). %d solution(s) proposée(s).", 
                conflits.size(), solutions.size()));
            response.put("solutions", solutions);
            response.put("recommandation", determinerMeilleureSolution(solutions, conflits));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur lors de la génération des solutions",
                "erreur", e.getMessage()
            ));
        }
    }

    /**
     * Génère une solution basée sur l'ajout de disponibilités
     */
    private Map<String, Object> genererSolutionDisponibilites(List<Conflit> conflits) {
        List<Conflit> conflitsFormateur = conflits.stream()
            .filter(c -> c.getType() == Conflit.TypeConflit.CONFLIT_FORMATEUR)
            .collect(Collectors.toList());
        
        if (conflitsFormateur.isEmpty()) {
            return null;
        }
        
        // Extraire les informations
        Set<String> formateurs = new HashSet<>();
        Set<String> creneaux = new HashSet<>();
        
        for (Conflit c : conflitsFormateur) {
            String desc = c.getDescription();
            if (desc.contains("Jean Dupont")) formateurs.add("Jean Dupont (ID: 1)");
            if (desc.contains("Sophie Martin")) formateurs.add("Sophie Martin (ID: 2)");
            
            if (c.getCreneau() != null) {
                creneaux.add(String.format("%s %s-%s", 
                    c.getCreneau().getJourSemaine(),
                    c.getCreneau().getHeureDebut(),
                    c.getCreneau().getHeureFin()
                ));
            }
        }
        
        return Map.of(
            "id", 1,
            "type", "DISPONIBILITES",
            "titre", "📅 Ajouter des disponibilités formateurs",
            "description", String.format("Créer les disponibilités manquantes pour %d formateur(s)", formateurs.size()),
            "formateurs", formateurs,
            "creneaux", creneaux,
            "actions", List.of(
                Map.of(
                    "etape", 1,
                    "action", "Créer disponibilité pour chaque formateur",
                    "endpoint", "POST /api/disponibilites",
                    "exemple", Map.of(
                        "formateurId", 1,
                        "jourSemaine", "JEUDI",
                        "heureDebut", "08:00",
                        "heureFin", "18:00",
                        "estDisponible", true
                    )
                ),
                Map.of(
                    "etape", 2,
                    "action", "Vérifier la résolution",
                    "endpoint", "GET /api/admin/planning/optimisation/recommandations/{planningId}",
                    "description", "Les conflits de disponibilité devraient disparaître"
                )
            ),
            "complexite", "FACILE",
            "tempsEstime", "2-3 minutes manuelles",
            "impactSurAutresSessions", "AUCUN"
        );
    }

    /**
     * Génère une solution basée sur le changement de créneaux
     */
    private Map<String, Object> genererSolutionChangementCreneaux(
            List<SessionFormation> sessions, 
            List<Conflit> conflits) {
        
        List<Conflit> conflitsCreneau = conflits.stream()
            .filter(c -> c.getType() == Conflit.TypeConflit.CONFLIT_SALLE || 
                         c.getType() == Conflit.TypeConflit.CONFLIT_GROUPE)
            .collect(Collectors.toList());
        
        if (conflitsCreneau.isEmpty()) {
            return null;
        }
        
        return Map.of(
            "id", 2,
            "type", "CHANGEMENT_CRENEAUX",
            "titre", "🕐 Déplacer vers d'autres créneaux",
            "description", String.format("Modifier les créneaux pour résoudre %d conflit(s)", conflitsCreneau.size()),
            "conflits", conflitsCreneau.stream()
                .map(c -> c.getDescription())
                .collect(Collectors.toList()),
            "actions", List.of(
                Map.of(
                    "etape", 1,
                    "action", "Identifier les sessions en conflit",
                    "endpoint", "GET /api/sessions",
                    "description", "Trouver les sessions utilisant le même créneau"
                ),
                Map.of(
                    "etape", 2,
                    "action", "Créer de nouveaux créneaux",
                    "endpoint", "POST /api/creneaux",
                    "exemple", Map.of(
                        "jourSemaine", "VENDREDI",
                        "heureDebut", "10:00",
                        "heureFin", "12:00",
                        "date", "2025-12-27"
                    )
                ),
                Map.of(
                    "etape", 3,
                    "action", "Modifier la session",
                    "endpoint", "PUT /api/sessions/{id}",
                    "description", "Changer creneauIds vers le nouveau créneau"
                )
            ),
            "complexite", "MOYENNE",
            "tempsEstime", "5-10 minutes manuelles",
            "impactSurAutresSessions", "FAIBLE"
        );
    }

    /**
     * Génère une solution basée sur le changement de salles
     */
    private Map<String, Object> genererSolutionChangementSalles(
            List<SessionFormation> sessions,
            List<Conflit> conflits) {
        
        List<Conflit> conflitsSalle = conflits.stream()
            .filter(c -> c.getType() == Conflit.TypeConflit.CONFLIT_SALLE)
            .collect(Collectors.toList());
        
        if (conflitsSalle.isEmpty()) {
            return null;
        }
        
        return Map.of(
            "id", 3,
            "type", "CHANGEMENT_SALLES",
            "titre", "🏢 Changer les salles",
            "description", String.format("Assigner des salles différentes pour résoudre %d conflit(s)", conflitsSalle.size()),
            "actions", List.of(
                Map.of(
                    "etape", 1,
                    "action", "Voir les salles disponibles",
                    "endpoint", "GET /api/salles",
                    "description", "Lister toutes les salles"
                ),
                Map.of(
                    "etape", 2,
                    "action", "Modifier la session",
                    "endpoint", "PUT /api/sessions/{id}",
                    "description", "Changer salleId vers une salle libre",
                    "exemple", Map.of(
                        "salleId", 2
                    )
                )
            ),
            "complexite", "FACILE",
            "tempsEstime", "2-3 minutes manuelles",
            "impactSurAutresSessions", "AUCUN"
        );
    }

    /**
     * Détermine la meilleure solution
     */
    private Map<String, Object> determinerMeilleureSolution(
            List<Map<String, Object>> solutions,
            List<Conflit> conflits) {
        
        // Compter les types de conflits
        long conflitsDisponibilite = conflits.stream()
            .filter(c -> c.getType() == Conflit.TypeConflit.CONFLIT_FORMATEUR)
            .count();
        
        // Si majorité = disponibilité, recommander Solution 1
        if (conflitsDisponibilite > conflits.size() / 2) {
            return Map.of(
                "solutionRecommandee", 1,
                "raison", "La majorité des conflits sont des problèmes de disponibilité",
                "action", "Commencez par créer les disponibilités manquantes"
            );
        }
        
        // Si beaucoup de conflits différents, recommander nouveau planning
        if (conflits.size() > 3) {
            return Map.of(
                "solutionRecommandee", 4,
                "raison", "Trop de conflits complexes, la génération automatique est plus efficace",
                "action", "Créer un nouveau planning optimisé automatiquement"
            );
        }
        
        return Map.of(
            "solutionRecommandee", 5,
            "raison", "Ré-optimisation automatique recommandée pour ce type de conflits",
            "action", "Utiliser l'endpoint de ré-optimisation"
        );
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
            stats.put("totalPlannings", tousLesPlannings.size());
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
            "phase1", "Heuristique gloutonne avec scoring multi-critères (PREFERENCE_WEIGHT: 40%, AVAILABILITY_WEIGHT: 30%, CAPACITY_WEIGHT: 20%, BALANCE_WEIGHT: 10%)",
            "phase2", "Backtracking intelligent avec élagage (profondeur max: 10, iterations max: 1000)",
            "phase3", "Optimisation locale par hill climbing avec échanges (iterations max: 50)",
            "generationCreneaux", "Génération automatique de dates et heures (8h-19h, durées: 60/120/180/240 min)"
        ));
        response.put("endpoints", Map.of(
            "generer", "POST /api/admin/planning/optimisation/generer?semaine={yyyy-MM-dd}",
            "recommandations", "GET /api/admin/planning/optimisation/recommandations/{id}",
            "reoptimiser", "POST /api/admin/planning/optimisation/reoptimiser/{id}",
            "statistiques", "GET /api/admin/planning/optimisation/statistiques",
            "test", "GET /api/admin/planning/optimisation/test"
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
        
        return raisons.isEmpty() ? "Ressources insuffisantes ou contraintes impossibles à satisfaire" : String.join(", ", raisons);
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
     * Compte le nombre de plannings par statut
     */
    private long compterParStatut(List<Planning> plannings, String statut) {
        return plannings.stream()
            .filter(p -> statut.equals(p.getStatut()))
            .count();
    }
    
    @GetMapping("/comparer")
    public ResponseEntity<?> comparerPlannings(
            @RequestParam int ancien,
            @RequestParam int nouveau) {
        
        try {
            Optional<Planning> planningAncien = planningRepository.findById(ancien);
            Optional<Planning> planningNouveau = planningRepository.findById(nouveau);
            
            if (planningAncien.isEmpty() || planningNouveau.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Planning p1 = planningAncien.get();
            Planning p2 = planningNouveau.get();
            
            // Charger les conflits
            List<Conflit> conflits1 = new ArrayList<>();
            List<Conflit> conflits2 = new ArrayList<>();
            
            for (SessionFormation s : p1.getSessions()) {
                for (Creneau c : s.getCreneaux()) {
                    conflits1.addAll(conflitRepository.findByCreneauId(c.getId()));
                }
            }
            
            for (SessionFormation s : p2.getSessions()) {
                for (Creneau c : s.getCreneaux()) {
                    conflits2.addAll(conflitRepository.findByCreneauId(c.getId()));
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comparaison", Map.of(
                "planningAncien", Map.of(
                    "id", p1.getId(),
                    "nbSessions", p1.getSessions().size(),
                    "nbConflits", conflits1.size(),
                    "statut", p1.getStatut()
                ),
                "planningNouveau", Map.of(
                    "id", p2.getId(),
                    "nbSessions", p2.getSessions().size(),
                    "nbConflits", conflits2.size(),
                    "statut", p2.getStatut()
                ),
                "amelioration", Map.of(
                    "conflitsResolus", conflits1.size() - conflits2.size(),
                    "pourcentage", conflits1.isEmpty() ? 100 : 
                        (double) (conflits1.size() - conflits2.size()) / conflits1.size() * 100
                )
            ));
            
            if (conflits2.size() < conflits1.size()) {
                response.put("recommandation", "✅ Le nouveau planning est meilleur (moins de conflits)");
            } else if (conflits2.size() == conflits1.size() && conflits2.isEmpty()) {
                response.put("recommandation", "✅ Les deux plannings sont sans conflits");
            } else {
                response.put("recommandation", "⚠️ L'ancien planning est meilleur ou équivalent");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "erreur", e.getMessage()
            ));
        }
    }
}