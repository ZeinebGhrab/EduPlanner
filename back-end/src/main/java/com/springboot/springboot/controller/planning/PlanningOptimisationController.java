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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ========================================================================
 * CONTRÔLEUR OPTIMISÉ POUR LA RÉSOLUTION AUTOMATIQUE DE CONFLITS
 * ========================================================================
 * Version améliorée avec résolution intelligente en un clic
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
     * 1. RÉSOLUTION AUTOMATIQUE INTELLIGENTE - EN UN CLIC
     * ========================================================================
     * Cette méthode résout TOUS les conflits en utilisant les meilleures solutions
     */
    @PostMapping("/resoudre-tout/{planningId}")
    @Transactional
    public ResponseEntity<?> resoudreTousConflits(@PathVariable int planningId) {
        try {
            long startTime = System.currentTimeMillis();
            
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
                    "message", "✅ Aucun conflit à résoudre",
                    "planningId", planningId,
                    "nbConflits", 0,
                    "nbResolus", 0,
                    "duree", 0
                ));
            }
            
            int nbConflitsInitial = conflits.size();
            int nbResolus = 0;
            int nbEchecs = 0;
            List<Map<String, Object>> actionsEffectuees = new ArrayList<>();
            
            // Trier les conflits par priorité (severité décroissante)
            conflits.sort((c1, c2) -> Integer.compare(
                c2.getSeverite() != null ? c2.getSeverite() : 0, 
                c1.getSeverite() != null ? c1.getSeverite() : 0
            ));
            
            // Résoudre chaque conflit avec la meilleure solution disponible
            for (Conflit conflit : conflits) {
                Map<String, Object> resultat = resoudreConflitIntelligent(conflit);
                
                if ((Boolean) resultat.get("success")) {
                    nbResolus++;
                    actionsEffectuees.add(Map.of(
                        "conflitId", conflit.getId(),
                        "type", conflit.getType().toString(),
                        "description", conflit.getDescription(),
                        "solution", resultat.get("solution"),
                        "statut", "✅ Résolu"
                    ));
                    
                    // ✅ Supprimer le conflit résolu
                    conflitRepository.delete(conflit);
                    
                    // ✅ AJOUT : Vérifier si la session n'a plus de conflits
                    if (conflit.getSessionsImpliquees() != null && !conflit.getSessionsImpliquees().isEmpty()) {
                        for (SessionFormation session : conflit.getSessionsImpliquees()) {
                            // Compter les conflits restants pour cette session
                            long nbConflitsRestants = conflits.stream()
                                .filter(c -> c.getId() != conflit.getId() && 
                                            c.getSessionsImpliquees() != null &&
                                            c.getSessionsImpliquees().stream()
                                                .anyMatch(s -> s.getId() == session.getId()))
                                .count();
                            
                            // Si plus de conflits, marquer la session comme VALIDE
                            if (nbConflitsRestants == 0) {
                                session.setStatut("VALIDE");
                                session.setADesConflits(false);
                                sessionRepository.save(session);
                            }
                        }
                    }
                 // Supprimer le conflit résolu
                  conflitRepository.delete(conflit);
                } else { 
                    nbEchecs++;
                    actionsEffectuees.add(Map.of(
                        "conflitId", conflit.getId(),
                        "type", conflit.getType().toString(),
                        "description", conflit.getDescription(),
                        "erreur", resultat.get("message"),
                        "statut", "❌ Non résolu"
                    ));
                }
            }
            
            long endTime = System.currentTimeMillis();
            double tauxReussite = nbConflitsInitial > 0 ? 
                (double) nbResolus / nbConflitsInitial * 100 : 0;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format(
                    "✅ Résolution terminée : %d/%d conflits résolus (%.1f%%)",
                    nbResolus, nbConflitsInitial, tauxReussite
                ),
                "planningId", planningId,
                "nbConflitsInitial", nbConflitsInitial,
                "nbResolus", nbResolus,
                "nbEchecs", nbEchecs,
                "tauxReussite", String.format("%.1f%%", tauxReussite),
                "duree", endTime - startTime,
                "actions", actionsEffectuees
            ));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur lors de la résolution automatique",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * 2. RÉSOLUTION INTELLIGENTE D'UN CONFLIT INDIVIDUEL
     * ========================================================================
     * Choisit automatiquement la meilleure solution parmi celles disponibles
     */
    private Map<String, Object> resoudreConflitIntelligent(Conflit conflit) {
        // Générer les solutions possibles
        List<Map<String, Object>> solutions = genererSolutionsDetaillees(conflit);
        
        if (solutions.isEmpty()) {
            return Map.of(
                "success", false,
                "message", "Aucune solution disponible"
            );
        }
        
        // Trier les solutions par priorité
        solutions.sort((s1, s2) -> {
            int priorite1 = getPrioriteSolution((String) s1.get("type"));
            int priorite2 = getPrioriteSolution((String) s2.get("type"));
            return Integer.compare(priorite1, priorite2);
        });
        
        // Essayer chaque solution jusqu'à en trouver une qui fonctionne
        for (Map<String, Object> solution : solutions) {
            try {
                boolean success = appliquerSolutionInterne(solution);
                if (success) {
                    return Map.of(
                        "success", true,
                        "solution", solution.get("label"),
                        "type", solution.get("type")
                    );
                }
            } catch (Exception e) {
                // Continuer avec la solution suivante
                continue;
            }
        }
        
        return Map.of(
            "success", false,
            "message", "Toutes les solutions ont échoué"
        );
    }
    
    /**
     * Définit la priorité des types de solutions
     * Plus le nombre est petit, plus la priorité est haute
     */
    private int getPrioriteSolution(String type) {
        switch (type) {
            case "CORRIGER_DATE_CRENEAU": return 0;  // Priorité MAXIMALE (erreur de config)
            case "CREER_DISPONIBILITE": return 1;    // Priorité très haute
            case "CHANGER_SALLE": return 2;
            case "CHANGER_CRENEAU": return 3;
            case "CHANGER_FORMATEUR": return 4;      // Priorité la plus basse
            default: return 99;
        }
    }
    
    /**
     * ========================================================================
     * 3. APPLICATION INTERNE D'UNE SOLUTION
     * ========================================================================
     */
    private boolean appliquerSolutionInterne(Map<String, Object> solution) {
        String typeSolution = (String) solution.get("type");
        Map<String, Object> data = (Map<String, Object>) solution.get("data");
        
        try {
            switch (typeSolution) {
                case "CHANGER_FORMATEUR":
                    return changerFormateurInterne(data);
                case "CHANGER_SALLE":
                    return changerSalleInterne(data);
                case "CHANGER_CRENEAU":
                    return changerCreneauInterne(data);
                case "CREER_DISPONIBILITE":
                    return creerDisponibiliteInterne(data);
                case "CORRIGER_DATE_CRENEAU":
                    return corrigerDateCreneauInterne(data);
                default:
                    return false;
            }
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * ========================================================================
     * 4. MÉTHODES DE RÉSOLUTION SPÉCIFIQUES
     * ========================================================================
     */
    
    private boolean changerFormateurInterne(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            
            // Trouver le premier formateur disponible dans les options
            List<Map<String, Object>> options = (List<Map<String, Object>>) data.get("options");
            if (options == null || options.isEmpty()) {
                return false;
            }
            
            int nouveauFormateurId = (Integer) options.get(0).get("id");
            
            SessionFormation session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable"));
            
            Formateur nouveauFormateur = formateurRepository.findById(nouveauFormateurId)
                .orElseThrow(() -> new RuntimeException("Formateur introuvable"));
            
            session.setFormateur(nouveauFormateur);
            sessionRepository.save(session);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    private boolean changerSalleInterne(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            
            // Trouver la première salle disponible dans les options
            List<Map<String, Object>> options = (List<Map<String, Object>>) data.get("options");
            if (options == null || options.isEmpty()) {
                return false;
            }
            
            int nouvelleSalleId = (Integer) options.get(0).get("id");
            
            SessionFormation session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable"));
            
            Salle nouvelleSalle = salleRepository.findById(nouvelleSalleId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));
            
            session.setSalle(nouvelleSalle);
            sessionRepository.save(session);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    private boolean changerCreneauInterne(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            
            // Trouver le premier créneau disponible dans les options
            List<Map<String, Object>> options = (List<Map<String, Object>>) data.get("options");
            if (options == null || options.isEmpty()) {
                return false;
            }
            
            int nouveauCreneauId = (Integer) options.get(0).get("id");
            
            SessionFormation session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable"));
            
            Creneau nouveauCreneau = creneauRepository.findById(nouveauCreneauId)
                .orElseThrow(() -> new RuntimeException("Créneau introuvable"));
            
            session.setCreneaux(List.of(nouveauCreneau));
            sessionRepository.save(session);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    private boolean creerDisponibiliteInterne(Map<String, Object> data) {
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
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Corrige la date d'un créneau pour qu'elle soit dans la semaine du planning
     */
    private boolean corrigerDateCreneauInterne(Map<String, Object> data) {
        try {
            int creneauId = (Integer) data.get("creneauId");
            String planningSemaine = (String) data.get("planningSemaine");
            String jourSemaine = (String) data.get("jourSemaine");
            
            Creneau creneau = creneauRepository.findById(creneauId)
                .orElseThrow(() -> new RuntimeException("Créneau introuvable"));
            
            // Calculer la nouvelle date dans la semaine du planning
            LocalDate debutSemaine = LocalDate.parse(planningSemaine);
            
            // S'assurer que debutSemaine est bien un lundi
            while (debutSemaine.getDayOfWeek() != DayOfWeek.MONDAY) {
                debutSemaine = debutSemaine.minusDays(1);
            }
            
            // Calculer la date en fonction du jour de la semaine
            LocalDate nouvelleDate = calculerDateDepuisJour(debutSemaine, jourSemaine);
            
            // Mettre à jour le créneau
            creneau.setDate(nouvelleDate);
            creneau.setJourSemaine(jourSemaine);
            creneauRepository.save(creneau);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Calcule la date à partir du début de semaine et du jour
     */
    private LocalDate calculerDateDepuisJour(LocalDate debutSemaine, String jourSemaine) {
        Map<String, Integer> joursOffset = Map.of(
            "LUNDI", 0,
            "MARDI", 1,
            "MERCREDI", 2,
            "JEUDI", 3,
            "VENDREDI", 4,
            "SAMEDI", 5,
            "DIMANCHE", 6
        );
        
        int offset = joursOffset.getOrDefault(jourSemaine.toUpperCase(), 0);
        return debutSemaine.plusDays(offset);
    }
    
    /**
     * ========================================================================
     * 5. ANALYSE RAPIDE DES CONFLITS (POUR LE FRONTEND)
     * ========================================================================
     */
    @GetMapping("/resume/{planningId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getResumeConflits(@PathVariable int planningId) {
        try {
            Optional<Planning> planningOpt = planningRepository.findById(planningId);
            if (planningOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Planning introuvable"
                ));
            }
            
            Planning planning = planningOpt.get();
            List<SessionFormation> sessions = planning.getSessions();
            List<Conflit> conflits = recupererConflits(sessions);
            
            Map<Conflit.TypeConflit, Long> comptesParType = conflits.stream()
                .collect(Collectors.groupingBy(Conflit::getType, Collectors.counting()));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "planningId", planningId,
                "nbConflitsTotal", conflits.size(),
                "resolvable", conflits.size() > 0,
                "details", Map.of(
                    "conflitsFormateur", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_FORMATEUR, 0L),
                    "conflitsSalle", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_SALLE, 0L),
                    "conflitsGroupe", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_GROUPE, 0L),
                    "conflitsMateriel", comptesParType.getOrDefault(Conflit.TypeConflit.CONFLIT_MATERIEL, 0L)
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur lors de l'analyse",
                "erreur", e.getMessage()
            ));
        }
    }
    
    /**
     * ========================================================================
     * 6. ANALYSE COMPLÈTE (MÉTHODE EXISTANTE CONSERVÉE)
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
    
    // ========================================================================
    // MÉTHODES PRIVÉES - GÉNÉRATION DE SOLUTIONS DÉTAILLÉES
    // ========================================================================
    
    private List<Map<String, Object>> genererSolutionsDetaillees(Conflit conflit) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        // Cas spécial : CONTRAINTE_NON_RESPECTEE peut ne pas avoir de sessions associées
        if (conflit.getType() == Conflit.TypeConflit.CONTRAINTE_NON_RESPECTEE) {
            if (conflit.getCreneau() == null) {
                return solutions;
            }
            
            // Récupérer la session via le créneau
            Creneau creneau = conflit.getCreneau();
            SessionFormation session = recupererSessionParCreneau(creneau);
            
            solutions.addAll(genererSolutionsContrainteDetaillees(session, creneau, conflit));
            return solutions;
        }
        
        // Pour les autres types de conflits, vérifier les sessions implicquées
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
    
    private List<Map<String, Object>> genererSolutionsSalleDetaillees(
            SessionFormation session, Creneau creneau, int conflitId) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        List<Salle> sallesDisponibles = salleRepository.findAll().stream()
            .filter(s -> {
                if (session.getGroupe() != null && s.getCapacite() < session.getGroupe().getEffectif()) {
                    return false;
                }
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
     * Récupère la session associée à un créneau
     */
    private SessionFormation recupererSessionParCreneau(Creneau creneau) {
        List<SessionFormation> sessions = sessionRepository.findByCreneauId(creneau.getId());
        return sessions.isEmpty() ? null : sessions.get(0);
    }
    
    /**
     * Solutions pour les contraintes non respectées (ex: date hors semaine)
     */
    private List<Map<String, Object>> genererSolutionsContrainteDetaillees(
            SessionFormation session, Creneau creneau, Conflit conflit) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        // Vérifier si c'est un problème de date hors semaine
        if (conflit.getDescription() != null && 
            conflit.getDescription().contains("Date du créneau hors semaine du planning")) {
            
            // Si la session est null, essayer de la récupérer
            if (session == null) {
                session = recupererSessionParCreneau(creneau);
            }
            
            // Solution : Corriger la date du créneau pour qu'elle soit dans la semaine du planning
            if (session != null && session.getPlanning() != null && session.getPlanning().getSemaine() != null) {
                solutions.add(Map.of(
                    "id", "sol_corriger_date_" + conflit.getId(),
                    "type", "CORRIGER_DATE_CRENEAU",
                    "label", "📅 Corriger la date du créneau",
                    "description", "Replacer le créneau dans la semaine du planning (" + 
                        session.getPlanning().getSemaine() + ")",
                    "applicable", true,
                    "data", Map.of(
                        "creneauId", creneau.getId(),
                        "sessionId", session.getId(),
                        "planningSemaine", session.getPlanning().getSemaine().toString(),
                        "jourSemaine", creneau.getJourSemaine() != null ? creneau.getJourSemaine() : "JEUDI",
                        "heureDebut", creneau.getHeureDebut().toString(),
                        "heureFin", creneau.getHeureFin().toString()
                    )
                ));
            } else {
                // Si on ne peut pas trouver la session/planning, proposer une solution manuelle
                solutions.add(Map.of(
                    "id", "sol_manuel_" + conflit.getId(),
                    "type", "CORRECTION_MANUELLE",
                    "label", "✏️ Correction manuelle requise",
                    "description", "Impossible de corriger automatiquement - vérifier la configuration du créneau et du planning",
                    "applicable", false,
                    "data", Map.of(
                        "creneauId", creneau.getId(),
                        "probleme", "Session ou planning introuvable"
                    )
                ));
            }
        }
        
        // Ajouter d'autres solutions pour différentes contraintes si nécessaire
        return solutions;
    }
    
    private List<Map<String, Object>> genererSolutionsCreneauDetaillees(
            SessionFormation session, Creneau creneau, int conflitId) {
        List<Map<String, Object>> solutions = new ArrayList<>();
        
        List<Creneau> creneauxDisponibles = creneauRepository.findAll().stream()
            .filter(c -> c.getId() != creneau.getId())
            .filter(c -> c.getDate() != null && c.getDate().equals(creneau.getDate()))
            .filter(c -> {
                if (session.getFormateur() != null && 
                    !verifierDisponibiliteFormateur(session.getFormateur(), c)) {
                    return false;
                }
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