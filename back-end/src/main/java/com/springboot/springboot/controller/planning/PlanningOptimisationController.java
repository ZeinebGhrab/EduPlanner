package com.springboot.springboot.controller.planning;

import com.springboot.springboot.entity.personne.DisponibiliteFormateur;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.personne.DisponibiliteFormateurRepository;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.planning.ConflitRepository;
import com.springboot.springboot.repository.planning.CreneauRepository;
import com.springboot.springboot.repository.planning.PlanningRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import com.springboot.springboot.repository.ressources.SalleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ========================================================================
 * CONTRÔLEUR AMÉLIORÉ POUR LA RÉSOLUTION AUTOMATIQUE DE CONFLITS
 * ========================================================================
 * Version avec résolution en un clic et détails complets
 */
@RestController
@RequestMapping("/api/admin/planning/resolution")
@CrossOrigin(origins = "*")
public class PlanningOptimisationController {
    
    @Autowired
    private PlanningRepository planningRepository;
    
    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private ConflitRepository conflitRepository;
    
    @Autowired
    private FormateurRepository formateurRepository;
    
    @Autowired
    private SalleRepository salleRepository;
    
    @Autowired
    private CreneauRepository creneauRepository;
    
    @Autowired
    private DisponibiliteFormateurRepository disponibiliteRepository;
    
    /**
     * ========================================================================
     * 1. ANALYSE COMPLÈTE AVEC SOLUTIONS DÉTAILLÉES ET APPLICABLES
     * ========================================================================
     */
    @GetMapping("/analyse/{planningId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> analyserConflits(@PathVariable int planningId) {
        try {
            Optional<Planning> planningOpt = planningRepository.findById(planningId);
            if (planningOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Planning introuvable",
                    "planningId", planningId
                ));
            }
            
            Planning planning = planningOpt.get();
            List<SessionFormation> sessions = planning.getSessions();
            List<Conflit> conflits = recupererConflits(sessions);
            
            if (conflits.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "planningId", planningId,
                    "nbConflits", 0,
                    "message", "✅ Aucun conflit détecté - Planning optimal",
                    "conflits", List.of(),
                    "statistiques", calculerStatistiques(conflits)
                ));
            }
            
            // Analyser et proposer des solutions APPLICABLES
            List<Map<String, Object>> conflitsAvecSolutions = new ArrayList<>();
            
            for (Conflit conflit : conflits) {
                Map<String, Object> conflitData = new HashMap<>();
                conflitData.put("id", conflit.getId());
                conflitData.put("type", conflit.getType().toString());
                conflitData.put("description", conflit.getDescription());
                conflitData.put("severite", conflit.getSeverite());
                
                // Créneau
                if (conflit.getCreneau() != null) {
                    Creneau c = conflit.getCreneau();
                    conflitData.put("creneau", Map.of(
                        "id", c.getId(),
                        "date", c.getDate() != null ? c.getDate().toString() : "N/A",
                        "jour", c.getJourSemaine(),
                        "heureDebut", c.getHeureDebut().toString(),
                        "heureFin", c.getHeureFin().toString()
                    ));
                }
                
                // Sessions impliquées
                List<Map<String, Object>> sessionsData = new ArrayList<>();
                if (conflit.getSessionsImpliquees() != null) {
                    for (SessionFormation s : conflit.getSessionsImpliquees()) {
                        sessionsData.add(Map.of(
                            "id", s.getId(),
                            "nomCours", s.getNomCours(),
                            "formateur", s.getFormateur() != null ? 
                                Map.of(
                                    "id", s.getFormateur().getId(),
                                    "nom", s.getFormateur().getNom() + " " + s.getFormateur().getPrenom()
                                ) : Map.of(),
                            "salle", s.getSalle() != null ? 
                                Map.of(
                                    "id", s.getSalle().getId(),
                                    "nom", s.getSalle().getNom()
                                ) : Map.of(),
                            "groupe", s.getGroupe() != null ? 
                                Map.of(
                                    "id", s.getGroupe().getId(),
                                    "nom", s.getGroupe().getNom()
                                ) : Map.of()
                        ));
                    }
                }
                conflitData.put("sessionsImpliquees", sessionsData);
                
                // Générer solutions DÉTAILLÉES et APPLICABLES
                List<Map<String, Object>> solutions = genererSolutionsDetaillees(conflit);
                conflitData.put("solutions", solutions);
                conflitData.put("nbSolutions", solutions.size());
                
                conflitsAvecSolutions.add(conflitData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("planningId", planningId);
            response.put("nbConflits", conflits.size());
            response.put("message", String.format("⚠️ %d conflit(s) détecté(s)", conflits.size()));
            response.put("conflits", conflitsAvecSolutions);
            response.put("statistiques", calculerStatistiques(conflits));
            response.put("recommandation", genererRecommandation(conflits));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur lors de l'analyse",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * 2. APPLIQUER UNE SOLUTION EN UN CLIC
     * ========================================================================
     */
    @PostMapping("/appliquer-solution")
    @Transactional
    public ResponseEntity<?> appliquerSolution(@RequestBody Map<String, Object> request) {
        try {
            String typeSolution = (String) request.get("type");
            Map<String, Object> data = (Map<String, Object>) request.get("data");
            
            switch (typeSolution) {
                case "CHANGER_FORMATEUR":
                    return changerFormateurAuto(data);
                case "CHANGER_SALLE":
                    return changerSalleAuto(data);
                case "CHANGER_CRENEAU":
                    return changerCreneauAuto(data);
                case "CREER_DISPONIBILITE":
                    return creerDisponibiliteAuto(data);
                default:
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Type de solution inconnu: " + typeSolution
                    ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur lors de l'application de la solution",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * 3. RÉSOLUTION AUTOMATIQUE INTELLIGENTE
     * ========================================================================
     */
    @PostMapping("/auto/{planningId}")
    @Transactional
    public ResponseEntity<?> resolutionAutomatique(@PathVariable int planningId) {
        try {
            Planning planning = planningRepository.findById(planningId)
                .orElseThrow(() -> new RuntimeException("Planning introuvable"));
            
            List<SessionFormation> sessions = planning.getSessions();
            List<Conflit> conflits = recupererConflits(sessions);
            
            if (conflits.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Aucun conflit à résoudre",
                    "nbConflitsResolus", 0
                ));
            }
            
            int nbResolus = 0;
            List<Map<String, String>> actionsEffectuees = new ArrayList<>();
            
            for (Conflit conflit : conflits) {
                boolean resolu = false;
                String action = "";
                
                switch (conflit.getType()) {
                    case CONFLIT_FORMATEUR:
                        resolu = resoudreConflitFormateurAuto(conflit);
                        action = resolu ? "Formateur changé automatiquement" : "Échec changement formateur";
                        break;
                    case CONFLIT_SALLE:
                        resolu = resoudreConflitSalleAuto(conflit);
                        action = resolu ? "Salle changée automatiquement" : "Échec changement salle";
                        break;
                    case CONFLIT_GROUPE:
                        resolu = resoudreConflitGroupeAuto(conflit);
                        action = resolu ? "Créneau changé automatiquement" : "Échec changement créneau";
                        break;
                }
                
                if (resolu) {
                    nbResolus++;
                    actionsEffectuees.add(Map.of(
                        "conflit", conflit.getDescription(),
                        "action", action,
                        "statut", "✅ Résolu"
                    ));
                    conflitRepository.delete(conflit);
                } else {
                    actionsEffectuees.add(Map.of(
                        "conflit", conflit.getDescription(),
                        "action", action,
                        "statut", "❌ Non résolu"
                    ));
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("%d conflit(s) résolu(s) sur %d", nbResolus, conflits.size()),
                "nbConflitsInitial", conflits.size(),
                "nbConflitsResolus", nbResolus,
                "tauxReussite", String.format("%.1f%%", (double) nbResolus / conflits.size() * 100),
                "actions", actionsEffectuees
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur lors de la résolution automatique",
                "erreur", e.getMessage()
            ));
        }
    }
    
    // ========================================================================
    // MÉTHODES PRIVÉES - GÉNÉRATION DE SOLUTIONS DÉTAILLÉES
    // ========================================================================
    
    /**
     * Génère des solutions détaillées et directement applicables
     */
    private List<Map<String, Object>> genererSolutionsDetaillees(Conflit conflit) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        if (conflit.getCreneau() == null || conflit.getSessionsImpliquees() == null || 
            conflit.getSessionsImpliquees().isEmpty()) {
            return solutions;
        }
        
        SessionFormation session = conflit.getSessionsImpliquees().get(0);
        Creneau creneau = conflit.getCreneau();
        
        switch (conflit.getType()) {
            case CONFLIT_FORMATEUR:
                solutions.addAll(genererSolutionsFormateurDetaillees(session, creneau, conflit.getId()));
                break;
            case CONFLIT_SALLE:
                solutions.addAll(genererSolutionsSalleDetaillees(session, creneau, conflit.getId()));
                break;
            case CONFLIT_GROUPE:
                solutions.addAll(genererSolutionsCreneauDetaillees(session, creneau, conflit.getId()));
                break;
        }
        
        return solutions;
    }
    
    /**
     * Solutions détaillées pour conflit de formateur
     */
    private List<Map<String, Object>> genererSolutionsFormateurDetaillees(
            SessionFormation session, Creneau creneau, int conflitId) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        // Solution 1: Créer disponibilité
        if (session.getFormateur() != null) {
            solutions.add(Map.of(
                "id", "sol_dispo_" + conflitId,
                "type", "CREER_DISPONIBILITE",
                "label", "📅 Créer disponibilité",
                "description", "Ajouter une disponibilité pour " + 
                    session.getFormateur().getNom() + " " + session.getFormateur().getPrenom(),
                "applicable", true,
                "data", Map.of(
                    "formateurId", session.getFormateur().getId(),
                    "formateurNom", session.getFormateur().getNom() + " " + session.getFormateur().getPrenom(),
                    "jourSemaine", creneau.getJourSemaine(),
                    "heureDebut", creneau.getHeureDebut().toString(),
                    "heureFin", creneau.getHeureFin().toString()
                )
            ));
        }
        
        // Solution 2: Changer de formateur
        List<Formateur> formateursDisponibles = formateurRepository.findAll().stream()
            .filter(f -> verifierDisponibiliteFormateur(f, creneau))
            .filter(f -> session.getFormateur() == null || f.getId() != session.getFormateur().getId())
            .limit(5)
            .collect(Collectors.toList());
        
        if (!formateursDisponibles.isEmpty()) {
        	List<Map<String, Object>> options = formateursDisponibles.stream()
        		    .map(f -> {
        		        Map<String, Object> map = new HashMap<>();
        		        map.put("id", f.getId());
        		        map.put("nom", f.getNom() + " " + f.getPrenom());
        		        map.put("specialite", f.getSpecialite() != null ? f.getSpecialite() : "N/A");
        		        return map;
        		    })
        		    .collect(Collectors.toList());

            
            solutions.add(Map.of(
                "id", "sol_chg_form_" + conflitId,
                "type", "CHANGER_FORMATEUR",
                "label", "👨‍🏫 Changer de formateur",
                "description", formateursDisponibles.size() + " formateur(s) disponible(s)",
                "applicable", true,
                "data", Map.of(
                    "sessionId", session.getId(),
                    "options", options
                )
            ));
        }
        
        return solutions;
    }
    
    /**
     * Solutions détaillées pour conflit de salle
     */
    private List<Map<String, Object>> genererSolutionsSalleDetaillees(
            SessionFormation session, Creneau creneau, int conflitId) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        List<Salle> sallesDisponibles = salleRepository.findAll().stream()
            .filter(s -> {
                // Vérifier capacité
                if (session.getGroupe() != null && s.getCapacite() < session.getGroupe().getEffectif()) {
                    return false;
                }
                // Vérifier disponibilité
                List<SessionFormation> sessionsUtilisant = sessionRepository
                    .findSalleConflicts(s.getId(), creneau.getDate(), creneau.getHeureDebut(), creneau.getHeureFin());
                return sessionsUtilisant.isEmpty();
            })
            .filter(s -> session.getSalle() == null || s.getId() != session.getSalle().getId())
            .limit(10)
            .collect(Collectors.toList());
        
        if (!sallesDisponibles.isEmpty()) {
        	List<Map<String, Object>> options = sallesDisponibles.stream()
        		    .map(s -> {
        		        Map<String, Object> map = new HashMap<>();
        		        map.put("id", s.getId());
        		        map.put("nom", s.getNom());
        		        map.put("capacite", s.getCapacite());
        		        map.put("batiment", s.getBatiment() != null ? s.getBatiment() : "N/A");
        		        map.put("adequation", calculerAdequationSalle(s, session));
        		        return map;
        		    })
        		    .sorted((a, b) ->
        		        Double.compare(
        		            (Double) b.get("adequation"),
        		            (Double) a.get("adequation")
        		        )
        		    )
        		    .collect(Collectors.toList());

            
            solutions.add(Map.of(
                "id", "sol_chg_salle_" + conflitId,
                "type", "CHANGER_SALLE",
                "label", "🏢 Changer de salle",
                "description", sallesDisponibles.size() + " salle(s) disponible(s)",
                "applicable", true,
                "data", Map.of(
                    "sessionId", session.getId(),
                    "options", options
                )
            ));
        }
        
        return solutions;
    }
    
    /**
     * Solutions détaillées pour conflit de créneau
     */
    private List<Map<String, Object>> genererSolutionsCreneauDetaillees(
            SessionFormation session, Creneau creneau, int conflitId) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        List<Creneau> creneauxDisponibles = creneauRepository.findAll().stream()
            .filter(c -> c.getId() != creneau.getId())
            .filter(c -> c.getDate() != null && c.getDate().equals(creneau.getDate()))
            .filter(c -> {
                // Vérifier disponibilité formateur
                if (session.getFormateur() != null && 
                    !verifierDisponibiliteFormateur(session.getFormateur(), c)) {
                    return false;
                }
                // Vérifier disponibilité groupe
                if (session.getGroupe() != null) {
                    List<SessionFormation> conflitsGroupe = sessionRepository
                        .findGroupeConflicts(session.getGroupe().getId(), c.getDate(), 
                                           c.getHeureDebut(), c.getHeureFin());
                    return conflitsGroupe.isEmpty();
                }
                return true;
            })
            .limit(8)
            .collect(Collectors.toList());
        
        if (!creneauxDisponibles.isEmpty()) {
        	List<Map<String, Object>> options = creneauxDisponibles.stream()
        		    .map(c -> {
        		        Map<String, Object> map = new HashMap<>();
        		        map.put("id", c.getId());
        		        map.put("jour", c.getJourSemaine());
        		        map.put("heureDebut", c.getHeureDebut().toString());
        		        map.put("heureFin", c.getHeureFin().toString());
        		        map.put("date", c.getDate() != null ? c.getDate().toString() : "N/A");
        		        return map;
        		    })
        		    .collect(Collectors.toList());

            
            solutions.add(Map.of(
                "id", "sol_chg_creneau_" + conflitId,
                "type", "CHANGER_CRENEAU",
                "label", "🕐 Changer de créneau",
                "description", creneauxDisponibles.size() + " créneau(x) disponible(s)",
                "applicable", true,
                "data", Map.of(
                    "sessionId", session.getId(),
                    "options", options
                )
            ));
        }
        
        return solutions;
    }
    
    // ========================================================================
    // MÉTHODES PRIVÉES - APPLICATION AUTOMATIQUE DES SOLUTIONS
    // ========================================================================
    
    private ResponseEntity<?> changerFormateurAuto(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            int nouveauFormateurId = (Integer) data.get("nouveauFormateurId");
            
            SessionFormation session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable"));
            
            Formateur nouveauFormateur = formateurRepository.findById(nouveauFormateurId)
                .orElseThrow(() -> new RuntimeException("Formateur introuvable"));
            
            String ancienFormateur = session.getFormateur() != null ? 
                session.getFormateur().getNom() + " " + session.getFormateur().getPrenom() : "N/A";
            
            session.setFormateur(nouveauFormateur);
            sessionRepository.save(session);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Formateur changé avec succès",
                "details", Map.of(
                    "sessionId", sessionId,
                    "ancienFormateur", ancienFormateur,
                    "nouveauFormateur", nouveauFormateur.getNom() + " " + nouveauFormateur.getPrenom()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    private ResponseEntity<?> changerSalleAuto(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            int nouvelleSalleId = (Integer) data.get("nouvelleSalleId");
            
            SessionFormation session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable"));
            
            Salle nouvelleSalle = salleRepository.findById(nouvelleSalleId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));
            
            String ancienneSalle = session.getSalle() != null ? session.getSalle().getNom() : "N/A";
            
            session.setSalle(nouvelleSalle);
            sessionRepository.save(session);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Salle changée avec succès",
                "details", Map.of(
                    "sessionId", sessionId,
                    "ancienneSalle", ancienneSalle,
                    "nouvelleSalle", nouvelleSalle.getNom()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    private ResponseEntity<?> changerCreneauAuto(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            int nouveauCreneauId = (Integer) data.get("nouveauCreneauId");
            
            SessionFormation session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable"));
            
            Creneau nouveauCreneau = creneauRepository.findById(nouveauCreneauId)
                .orElseThrow(() -> new RuntimeException("Créneau introuvable"));
            
            String ancienCreneau = "N/A";
            if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
                Creneau c = session.getCreneaux().get(0);
                ancienCreneau = c.getJourSemaine() + " " + c.getHeureDebut() + "-" + c.getHeureFin();
            }
            
            session.setCreneaux(List.of(nouveauCreneau));
            sessionRepository.save(session);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Créneau changé avec succès",
                "details", Map.of(
                    "sessionId", sessionId,
                    "ancienCreneau", ancienCreneau,
                    "nouveauCreneau", nouveauCreneau.getJourSemaine() + " " + 
                        nouveauCreneau.getHeureDebut() + "-" + nouveauCreneau.getHeureFin()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    private ResponseEntity<?> creerDisponibiliteAuto(Map<String, Object> data) {
        try {
            int formateurId = (Integer) data.get("formateurId");
            String jourSemaine = (String) data.get("jourSemaine");
            String heureDebut = (String) data.get("heureDebut");
            String heureFin = (String) data.get("heureFin");
            
            Formateur formateur = formateurRepository.findById(formateurId)
                .orElseThrow(() -> new RuntimeException("Formateur introuvable"));
            
            DisponibiliteFormateur dispo = new DisponibiliteFormateur();
            dispo.setFormateur(formateur);
            dispo.setJourSemaine(DisponibiliteFormateur.JourEnum.valueOf(jourSemaine.toUpperCase()));
            dispo.setHeureDebut(LocalTime.parse(heureDebut));
            dispo.setHeureFin(LocalTime.parse(heureFin));
            dispo.setEstDisponible(true);
            
            disponibiliteRepository.save(dispo);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Disponibilité créée avec succès",
                "details", Map.of(
                    "formateur", formateur.getNom() + " " + formateur.getPrenom(),
                    "jour", jourSemaine,
                    "horaires", heureDebut + " - " + heureFin
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    // ========================================================================
    // MÉTHODES UTILITAIRES
    // ========================================================================
    
    private List<Conflit> recupererConflits(List<SessionFormation> sessions) {
        Set<Integer> creneauxIds = new HashSet<>();
        for (SessionFormation session : sessions) {
            if (session.getCreneaux() != null) {
                for (Creneau creneau : session.getCreneaux()) {
                    creneauxIds.add(creneau.getId());
                }
            }
        }
        
        List<Conflit> conflits = new ArrayList<>();
        for (Integer creneauId : creneauxIds) {
            conflits.addAll(conflitRepository.findByCreneauId(creneauId));
        }
        
        return conflits;
    }
    
    private Map<String, Object> calculerStatistiques(List<Conflit> conflits) {
        Map<Conflit.TypeConflit, Long> comptesParType = conflits.stream()
            .collect(Collectors.groupingBy(Conflit::getType, Collectors.counting()));
        
        return Map.of(
            "nbConflitsTotal", conflits.size(),
            "conflitsFormateur", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_FORMATEUR, 0L),
            "conflitsSalle", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_SALLE, 0L),
            "conflitsGroupe", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_GROUPE, 0L)
        );
    }
    
    private String genererRecommandation(List<Conflit> conflits) {
        long conflitsFormateur = conflits.stream()
            .filter(c -> c.getType() == Conflit.TypeConflit.CONFLIT_FORMATEUR).count();
        
        if (conflitsFormateur > conflits.size() / 2) {
            return "⚠️ Priorité: Gérer les disponibilités des formateurs";
        }
        return "⚠️ Utiliser la résolution automatique pour traiter tous les conflits";
    }
    
    private boolean verifierDisponibiliteFormateur(Formateur formateur, Creneau creneau) {
        if (formateur.getDisponibilites() == null) return false;
        
        try {
            DisponibiliteFormateur.JourEnum jour = 
                DisponibiliteFormateur.JourEnum.valueOf(creneau.getJourSemaine().toUpperCase());
            
            return formateur.getDisponibilites().stream()
                .anyMatch(d -> d.getJourSemaine() == jour &&
                             !creneau.getHeureDebut().isBefore(d.getHeureDebut()) &&
                             !creneau.getHeureFin().isAfter(d.getHeureFin()) &&
                             d.getEstDisponible());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
    
    private double calculerAdequationSalle(Salle salle, SessionFormation session) {
        if (session.getGroupe() == null) return 0.5;
        
        int effectif = session.getGroupe().getEffectif();
        int capacite = salle.getCapacite();
        
        if (effectif > capacite) return 0.0;
        
        double taux = (double) effectif / capacite;
        if (taux >= 0.7 && taux <= 1.0) return 1.0;
        if (taux >= 0.5) return 0.8;
        return 0.5;
    }
    
    private boolean resoudreConflitFormateurAuto(Conflit conflit) {
        if (conflit.getSessionsImpliquees() == null || conflit.getSessionsImpliquees().isEmpty()) {
            return false;
        }
        
        SessionFormation session = conflit.getSessionsImpliquees().get(0);
        Creneau creneau = conflit.getCreneau();
        
        if (creneau == null) return false;
        
        List<Formateur> formateursDisponibles = formateurRepository.findAll().stream()
            .filter(f -> verifierDisponibiliteFormateur(f, creneau))
            .collect(Collectors.toList());
        
        if (!formateursDisponibles.isEmpty()) {
            session.setFormateur(formateursDisponibles.get(0));
            sessionRepository.save(session);
            return true;
        }
        
        return false;
    }
    
    private boolean resoudreConflitSalleAuto(Conflit conflit) {
        if (conflit.getSessionsImpliquees() == null || conflit.getSessionsImpliquees().isEmpty()) {
            return false;
        }
        
        SessionFormation session = conflit.getSessionsImpliquees().get(0);
        Creneau creneau = conflit.getCreneau();
        
        if (creneau == null) return false;
        
        List<Salle> sallesDisponibles = salleRepository.findAll().stream()
            .filter(s -> {
                if (session.getGroupe() != null && s.getCapacite() < session.getGroupe().getEffectif()) {
                    return false;
                }
                List<SessionFormation> conflits = sessionRepository
                    .findSalleConflicts(s.getId(), creneau.getDate(), creneau.getHeureDebut(), creneau.getHeureFin());
                return conflits.isEmpty();
            })
            .collect(Collectors.toList());
        
        if (!sallesDisponibles.isEmpty()) {
            session.setSalle(sallesDisponibles.get(0));
            sessionRepository.save(session);
            return true;
        }
        
        return false;
    }
    
    private boolean resoudreConflitGroupeAuto(Conflit conflit) {
        if (conflit.getSessionsImpliquees() == null || conflit.getSessionsImpliquees().isEmpty()) {
            return false;
        }
        
        SessionFormation session = conflit.getSessionsImpliquees().get(0);
        
        List<Creneau> creneauxDisponibles = creneauRepository.findAll().stream()
            .filter(c -> {
                if (session.getFormateur() != null && !verifierDisponibiliteFormateur(session.getFormateur(), c)) {
                    return false;
                }
                return true;
            })
            .limit(1)
            .collect(Collectors.toList());
        
        if (!creneauxDisponibles.isEmpty()) {
            session.setCreneaux(List.of(creneauxDisponibles.get(0)));
            sessionRepository.save(session);
            return true;
        }
        
        return false;
    }
    
    /**
     * Suppression d'un conflit
     */
    @DeleteMapping("/conflit/{conflitId}")
    @Transactional
    public ResponseEntity<?> supprimerConflit(@PathVariable int conflitId) {
        try {
            conflitRepository.deleteById(conflitId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Conflit supprimé"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
}