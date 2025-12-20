package com.springboot.springboot.service.planning;

import com.springboot.springboot.entity.common.Preference;
import com.springboot.springboot.entity.contraintes.*;
import com.springboot.springboot.entity.personne.DisponibiliteFormateur;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.*;
import com.springboot.springboot.entity.ressources.Materiel;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.planning.CreneauRepository;
import com.springboot.springboot.repository.planning.PlanningRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import com.springboot.springboot.repository.ressources.MaterielRepository;
import com.springboot.springboot.repository.ressources.SalleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service d'optimisation automatique de planning avec génération de créneaux
 * Génère automatiquement les dates et heures optimales pour chaque session
 */
@Service
public class PlanningOptimisationService {

    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private CreneauRepository creneauRepository;
    
    @Autowired
    private FormateurRepository formateurRepository;
    
    @Autowired
    private SalleRepository salleRepository;
    
    @Autowired
    private MaterielRepository materielRepository;
    
    @Autowired
    private PlanningRepository planningRepository;
    
    // Configuration de l'algorithme
    private static final int MAX_BACKTRACKING_DEPTH = 1000;
    private static final int MAX_LOCAL_OPTIMIZATION_ITERATIONS = 50;
    private static final double PREFERENCE_WEIGHT = 0.4;
    private static final double AVAILABILITY_WEIGHT = 0.3;
    private static final double CAPACITY_WEIGHT = 0.2;
    private static final double BALANCE_WEIGHT = 0.1;

    // Configuration des plages horaires disponibles
    private static final LocalTime[] HEURES_DEBUT_POSSIBLES = {
        LocalTime.of(8, 0),   // 08:00
        LocalTime.of(10, 0),  // 10:00
        LocalTime.of(13, 0),  // 13:00
        LocalTime.of(15, 0),  // 15:00
        LocalTime.of(17, 0)   // 17:00
    };

    /**
     * Classe interne pour représenter une affectation complète
     * Inclut date, heure, formateur, salle, matériel
     */
    private static class Affectation {
        SessionFormation session;
        LocalDate date;           // ✅ Date du créneau
        LocalTime heureDebut;     // ✅ Heure de début
        LocalTime heureFin;       // ✅ Heure de fin
        Creneau creneau;          // Créneau créé
        Formateur formateur;
        Salle salle;
        List<Materiel> materiels;
        double score;
    }

    /**
     * Résultat de l'optimisation
     */
    public static class ResultatOptimisation {
        private Planning planning;
        private List<SessionFormation> sessionsAssignees;
        private List<SessionFormation> sessionsNonAssignees;
        private double scoreGlobal;
        private int nbConflits;
        private Map<String, Object> statistiques;
        private String message;
        
        // Getters et setters
        public Planning getPlanning() { return planning; }
        public void setPlanning(Planning p) { this.planning = p; }
        public List<SessionFormation> getSessionsAssignees() { return sessionsAssignees; }
        public void setSessionsAssignees(List<SessionFormation> s) { this.sessionsAssignees = s; }
        public List<SessionFormation> getSessionsNonAssignees() { return sessionsNonAssignees; }
        public void setSessionsNonAssignees(List<SessionFormation> s) { this.sessionsNonAssignees = s; }
        public double getScoreGlobal() { return scoreGlobal; }
        public void setScoreGlobal(double s) { this.scoreGlobal = s; }
        public int getNbConflits() { return nbConflits; }
        public void setNbConflits(int n) { this.nbConflits = n; }
        public Map<String, Object> getStatistiques() { return statistiques; }
        public void setStatistiques(Map<String, Object> s) { this.statistiques = s; }
        public String getMessage() { return message; }
        public void setMessage(String m) { this.message = m; }
    }

    /**
     * Point d'entrée principal : génère un planning optimisé avec dates et heures
     */
    @Transactional
    public ResultatOptimisation genererPlanningOptimise(LocalDate debutSemaine) {
        long startTime = System.currentTimeMillis();
        
        ResultatOptimisation resultat = new ResultatOptimisation();
        Map<String, Object> stats = new HashMap<>();
        
        // Calculer la fin de semaine
        LocalDate finSemaine = debutSemaine.plusDays(6);
        
        // 1. Récupérer toutes les sessions sans planning
        List<SessionFormation> sessionsASatisfaire = sessionRepository.findAll().stream()
            .filter(s -> s.getPlanning() == null || s.getCreneaux() == null || s.getCreneaux().isEmpty())
            .collect(Collectors.toList());
        
        if (sessionsASatisfaire.isEmpty()) {
            resultat.setMessage("Aucune session à planifier");
            resultat.setSessionsAssignees(new ArrayList<>());
            resultat.setSessionsNonAssignees(new ArrayList<>());
            resultat.setStatistiques(stats);
            return resultat;
        }
        
        // 2. Récupérer toutes les ressources disponibles
        List<Formateur> formateurs = formateurRepository.findAll();
        List<Salle> salles = salleRepository.findAll();
        List<Materiel> materiels = materielRepository.findAll();
        
        stats.put("sessionsATraiter", sessionsASatisfaire.size());
        stats.put("formateursDisponibles", formateurs.size());
        stats.put("sallesDisponibles", salles.size());
        
        // 3. Générer toutes les plages horaires possibles pour la semaine
        List<PlageHoraire> plagesHoraires = genererPlagesHoraires(debutSemaine, finSemaine);
        stats.put("plagesHorairesGenerees", plagesHoraires.size());
        
        // 4. Créer un nouveau planning
        Planning planning = new Planning();
        planning.setSemaine(debutSemaine);
        planning.setStatut("EN_COURS");
        planning = planningRepository.save(planning);
        
        // 5. Trier les sessions par priorité (heuristique)
        List<SessionFormation> sessionsPrioritaires = trierSessionsParPriorite(
            sessionsASatisfaire, formateurs, salles
        );
        
        // 6. Phase 1 : Heuristique gloutonne avec génération de créneaux
        List<Affectation> affectations = new ArrayList<>();
        List<SessionFormation> sessionsNonAssignees = new ArrayList<>();
        
        for (SessionFormation session : sessionsPrioritaires) {
            Affectation meilleure = trouverMeilleureAffectation(
                session, plagesHoraires, formateurs, salles, 
                materiels, affectations
            );
            
            if (meilleure != null && meilleure.score > 0.3) {
                // Créer le créneau avec la date et l'heure optimales
                Creneau creneau = creerCreneau(meilleure.date, meilleure.heureDebut, meilleure.heureFin);
                meilleure.creneau = creneau;
                
                affectations.add(meilleure);
                appliquerAffectation(session, meilleure, planning);
            } else {
                sessionsNonAssignees.add(session);
            }
        }
        
        stats.put("phase1_assignees", affectations.size());
        stats.put("phase1_non_assignees", sessionsNonAssignees.size());
        
        // 7. Phase 2 : Backtracking pour les sessions difficiles
        int assigneesBacktracking = 0;
        if (!sessionsNonAssignees.isEmpty()) {
            List<SessionFormation> resoluesBacktracking = resoudreParBacktracking(
                sessionsNonAssignees, plagesHoraires, formateurs, 
                salles, materiels, affectations, planning
            );
            
            assigneesBacktracking = resoluesBacktracking.size();
            sessionsNonAssignees.removeAll(resoluesBacktracking);
        }
        
        stats.put("phase2_assignees_backtracking", assigneesBacktracking);
        
        // 8. Phase 3 : Optimisation locale
        double scoreAvantOptimisation = calculerScoreGlobal(affectations);
        optimisationLocale(affectations, planning);
        double scoreApresOptimisation = calculerScoreGlobal(affectations);
        
        stats.put("score_avant_optimisation", scoreAvantOptimisation);
        stats.put("score_apres_optimisation", scoreApresOptimisation);
        stats.put("amelioration", scoreApresOptimisation - scoreAvantOptimisation);
        
        // 9. Sauvegarder et calculer les statistiques finales
        planning = planningRepository.save(planning);
        
        List<SessionFormation> sessionsAssignees = affectations.stream()
            .map(a -> a.session)
            .collect(Collectors.toList());
        
        // Calculer le nombre de conflits
        List<Contrainte> contraintes = Arrays.asList(
            new ContrainteCapacite(),
            new ContrainteDisponibilite(),
            new ContrainteMateriel()
        );
        
        int nbConflits = 0;
        for (SessionFormation s : sessionsAssignees) {
            for (Contrainte c : contraintes) {
                if (!c.verifier(s)) {
                    nbConflits++;
                }
            }
        }
        
        long endTime = System.currentTimeMillis();
        stats.put("duree_ms", endTime - startTime);
        
        // Construire le résultat
        resultat.setPlanning(planning);
        resultat.setSessionsAssignees(sessionsAssignees);
        resultat.setSessionsNonAssignees(sessionsNonAssignees);
        resultat.setScoreGlobal(scoreApresOptimisation);
        resultat.setNbConflits(nbConflits);
        resultat.setStatistiques(stats);
        resultat.setMessage(String.format(
            "Planning généré : %d sessions assignées, %d non assignées, score %.2f, %d conflits en %d ms",
            sessionsAssignees.size(), sessionsNonAssignees.size(), 
            scoreApresOptimisation, nbConflits, endTime - startTime
        ));
        
        return resultat;
    }

    /**
     * Classe interne pour représenter une plage horaire possible
     */
    private static class PlageHoraire {
        LocalDate date;
        String jourSemaine;
        LocalTime heureDebut;
        LocalTime heureFin;
        int dureeMinutes;
        
        PlageHoraire(LocalDate date, LocalTime heureDebut, int dureeMinutes) {
            this.date = date;
            this.jourSemaine = convertirJourSemaine(date.getDayOfWeek());
            this.heureDebut = heureDebut;
            this.dureeMinutes = dureeMinutes;
            this.heureFin = heureDebut.plusMinutes(dureeMinutes);
        }
        
        private static String convertirJourSemaine(DayOfWeek dayOfWeek) {
            switch (dayOfWeek) {
                case MONDAY: return "LUNDI";
                case TUESDAY: return "MARDI";
                case WEDNESDAY: return "MERCREDI";
                case THURSDAY: return "JEUDI";
                case FRIDAY: return "VENDREDI";
                case SATURDAY: return "SAMEDI";
                case SUNDAY: return "DIMANCHE";
                default: return "LUNDI";
            }
        }
    }

    /**
     * Génère toutes les plages horaires possibles pour une semaine
     */
    private List<PlageHoraire> genererPlagesHoraires(LocalDate debut, LocalDate fin) {
        List<PlageHoraire> plages = new ArrayList<>();
        
        // Pour chaque jour de la semaine
        for (LocalDate date = debut; !date.isAfter(fin); date = date.plusDays(1)) {
            // Exclure le week-end par défaut (configurable)
            if (date.getDayOfWeek() == DayOfWeek.SATURDAY || 
                date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            
            // Pour chaque heure de début possible
            for (LocalTime heureDebut : HEURES_DEBUT_POSSIBLES) {
                // Générer des plages de différentes durées (60, 120, 180, 240 minutes)
                for (int duree : new int[]{60, 120, 180, 240}) {
                    LocalTime heureFin = heureDebut.plusMinutes(duree);
                    
                    // Vérifier que la plage ne dépasse pas 19h
                    if (heureFin.isBefore(LocalTime.of(19, 0)) || 
                        heureFin.equals(LocalTime.of(19, 0))) {
                        plages.add(new PlageHoraire(date, heureDebut, duree));
                    }
                }
            }
        }
        
        return plages;
    }

    /**
     * Crée un créneau avec date et heure
     */
    private Creneau creerCreneau(LocalDate date, LocalTime heureDebut, LocalTime heureFin) {
        Creneau creneau = new Creneau();
        creneau.setDate(date);
        creneau.setJourSemaine(PlageHoraire.convertirJourSemaine(date.getDayOfWeek()));
        creneau.setHeureDebut(heureDebut);
        creneau.setHeureFin(heureFin);
        return creneauRepository.save(creneau);
    }

    /**
     * Trouve la meilleure affectation pour une session
     * Génère la date et l'heure optimales
     */
    private Affectation trouverMeilleureAffectation(
            SessionFormation session,
            List<PlageHoraire> plagesHoraires,
            List<Formateur> formateurs,
            List<Salle> salles,
            List<Materiel> materiels,
            List<Affectation> affectationsExistantes) {
        
        Affectation meilleure = null;
        double meilleurScore = -1.0;
        
        // Filtrer les plages compatibles avec la durée de la session
        List<PlageHoraire> plagesCompatibles = plagesHoraires.stream()
            .filter(p -> p.dureeMinutes >= session.getDuree())
            .collect(Collectors.toList());
        
        for (PlageHoraire plage : plagesCompatibles) {
            for (Formateur formateur : formateurs) {
                // Vérifier disponibilité formateur pour cette date/heure
                if (!estFormateurDisponible(formateur, plage, affectationsExistantes)) {
                    continue;
                }
                
                for (Salle salle : salles) {
                    // Vérifier capacité et disponibilité salle
                    if (!estSalleCompatible(salle, session, plage, affectationsExistantes)) {
                        continue;
                    }
                    
                    // Vérifier matériel requis
                    List<Materiel> materielsAffectes = trouverMaterielsDisponibles(
                        session, plage, materiels, affectationsExistantes
                    );
                    
                    if (session.getMaterielRequis() != null && 
                        !materielsAffectes.containsAll(session.getMaterielRequis())) {
                        continue;
                    }
                    
                    // Calculer le score de cette affectation
                    double score = calculerScore(
                        session, plage, formateur, salle, materielsAffectes
                    );
                    
                    if (score > meilleurScore) {
                        meilleurScore = score;
                        meilleure = new Affectation();
                        meilleure.session = session;
                        meilleure.date = plage.date;
                        meilleure.heureDebut = plage.heureDebut;
                        meilleure.heureFin = plage.heureDebut.plusMinutes(session.getDuree());
                        meilleure.formateur = formateur;
                        meilleure.salle = salle;
                        meilleure.materiels = materielsAffectes;
                        meilleure.score = score;
                    }
                }
            }
        }
        
        return meilleure;
    }

    /**
     * Calcule le score d'une affectation avec date et heure
     */
    private double calculerScore(
            SessionFormation session,
            PlageHoraire plage,
            Formateur formateur,
            Salle salle,
            List<Materiel> materiels) {
        
        double score = 0.0;
        
        // 1. Satisfaction des préférences (40%)
        double prefScore = calculerScorePreferences(session, plage, formateur, salle);
        score += prefScore * PREFERENCE_WEIGHT;
        
        // 2. Respect des disponibilités (30%)
        double availScore = calculerScoreDisponibilites(formateur, plage);
        score += availScore * AVAILABILITY_WEIGHT;
        
        // 3. Optimisation de la capacité (20%)
        double capacityScore = calculerScoreCapacite(salle, session);
        score += capacityScore * CAPACITY_WEIGHT;
        
        // 4. Équilibre de la distribution (10%)
        double balanceScore = calculerScoreEquilibre(plage);
        score += balanceScore * BALANCE_WEIGHT;
        
        return score;
    }

    /**
     * Calcule le score basé sur les préférences (avec date/heure)
     */
    private double calculerScorePreferences(
            SessionFormation session,
            PlageHoraire plage,
            Formateur formateur,
            Salle salle) {
        
        double score = 0.5;
        
        // Préférences du formateur
        if (formateur.getPreferences() != null) {
            for (Preference pref : formateur.getPreferences()) {
                if (preferenceEstSatisfaite(pref, plage, salle)) {
                    score += 0.1 * (pref.getPriorite() / 5.0);
                }
            }
        }
        
        // Préférences du groupe via étudiants
        if (session.getGroupe() != null && session.getGroupe().getEtudiants() != null) {
            for (var etudiant : session.getGroupe().getEtudiants()) {
                if (etudiant.getPreferences() != null) {
                    for (Preference pref : etudiant.getPreferences()) {
                        if (preferenceEstSatisfaite(pref, plage, salle)) {
                            score += 0.05 * (pref.getPriorite() / 5.0);
                        }
                    }
                }
            }
        }
        
        return Math.min(1.0, score);
    }

    /**
     * Vérifie si une préférence est satisfaite (avec date/heure)
     */
    private boolean preferenceEstSatisfaite(Preference pref, PlageHoraire plage, Salle salle) {
        switch (pref.getType()) {
            case JOUR:
                return pref.getValeur() != null && 
                       pref.getValeur().equalsIgnoreCase(plage.jourSemaine);
            case HORAIRE:
                if (pref.getValeur() != null && pref.getValeur().contains("-")) {
                    String[] parts = pref.getValeur().split("-");
                    try {
                        LocalTime prefDebut = LocalTime.parse(parts[0].trim());
                        LocalTime prefFin = LocalTime.parse(parts[1].trim());
                        return !plage.heureDebut.isBefore(prefDebut) && 
                               !plage.heureFin.isAfter(prefFin);
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            case SALLE:
                return pref.getValeur() != null && 
                       pref.getValeur().equalsIgnoreCase(salle.getNom());
            default:
                return false;
        }
    }

    /**
     * Calcule le score de disponibilité du formateur (avec date/heure)
     */
    private double calculerScoreDisponibilites(Formateur formateur, PlageHoraire plage) {
        if (formateur.getDisponibilites() == null || formateur.getDisponibilites().isEmpty()) {
            return 0.5;
        }
        
        try {
            DisponibiliteFormateur.JourEnum jourEnum = 
                DisponibiliteFormateur.JourEnum.valueOf(plage.jourSemaine);
            
            for (DisponibiliteFormateur dispo : formateur.getDisponibilites()) {
                if (dispo.getJourSemaine() == jourEnum &&
                    !plage.heureDebut.isBefore(dispo.getHeureDebut()) &&
                    !plage.heureFin.isAfter(dispo.getHeureFin())) {
                    return dispo.getEstDisponible() ? 1.0 : 0.0;
                }
            }
        } catch (IllegalArgumentException e) {
            return 0.3;
        }
        
        return 0.3;
    }

    /**
     * Calcule le score d'utilisation optimale de la capacité
     */
    private double calculerScoreCapacite(Salle salle, SessionFormation session) {
        if (session.getGroupe() == null) {
            return 0.5;
        }
        
        int effectif = session.getGroupe().getEffectif();
        int capacite = salle.getCapacite();
        
        if (effectif > capacite) {
            return 0.0;
        }
        
        double tauxRemplissage = (double) effectif / capacite;
        
        if (tauxRemplissage >= 0.7 && tauxRemplissage <= 1.0) {
            return 1.0;
        } else if (tauxRemplissage >= 0.5) {
            return 0.8;
        } else {
            return 0.5;
        }
    }

    /**
     * Calcule le score d'équilibre de distribution (avec date)
     */
    private double calculerScoreEquilibre(PlageHoraire plage) {
        String jour = plage.jourSemaine.toUpperCase();
        
        // Bonus pour milieu de semaine
        if (jour.equals("MARDI") || jour.equals("MERCREDI") || jour.equals("JEUDI")) {
            // Bonus supplémentaire pour heures favorables (10h-15h)
            if (!plage.heureDebut.isBefore(LocalTime.of(10, 0)) && 
                !plage.heureDebut.isAfter(LocalTime.of(15, 0))) {
                return 1.0;
            }
            return 0.9;
        }
        
        return 0.7;
    }

    /**
     * Applique une affectation à une session
     */
    private void appliquerAffectation(SessionFormation session, Affectation affectation, Planning planning) {
        session.setFormateur(affectation.formateur);
        session.setSalle(affectation.salle);
        session.setCreneaux(Arrays.asList(affectation.creneau));
        session.setMaterielRequis(affectation.materiels);
        session.setPlanning(planning);
        session.setDateDebut(affectation.date);
        session.setDateFin(affectation.date);
        
        sessionRepository.save(session);
    }

    // ========== MÉTHODES UTILITAIRES ==========

    private List<SessionFormation> trierSessionsParPriorite(
            List<SessionFormation> sessions,
            List<Formateur> formateurs,
            List<Salle> salles) {
        
        return sessions.stream()
            .sorted((s1, s2) -> {
                int tailleGroupe1 = s1.getGroupe() != null ? s1.getGroupe().getEffectif() : 0;
                int tailleGroupe2 = s2.getGroupe() != null ? s2.getGroupe().getEffectif() : 0;
                if (tailleGroupe1 != tailleGroupe2) {
                    return Integer.compare(tailleGroupe2, tailleGroupe1);
                }
                
                int materielRare1 = compterMaterielRare(s1);
                int materielRare2 = compterMaterielRare(s2);
                return Integer.compare(materielRare2, materielRare1);
            })
            .collect(Collectors.toList());
    }

    private int compterMaterielRare(SessionFormation session) {
        if (session.getMaterielRequis() == null) return 0;
        return (int) session.getMaterielRequis().stream()
            .filter(m -> m.getQuantiteDisponible() < 3)
            .count();
    }

    private boolean estFormateurDisponible(
            Formateur formateur,
            PlageHoraire plage,
            List<Affectation> affectations) {
        
        // Vérifier si déjà affecté à cette plage
        boolean dejaAffecte = affectations.stream()
            .anyMatch(a -> a.formateur.getId() == formateur.getId() && 
                          a.date.equals(plage.date) &&
                          chevauche(a.heureDebut, a.heureFin, plage.heureDebut, plage.heureFin));
        
        if (dejaAffecte) return false;
        
        // Vérifier disponibilité déclarée
        if (formateur.getDisponibilites() == null) return false;
        
        try {
            DisponibiliteFormateur.JourEnum jourEnum = 
                DisponibiliteFormateur.JourEnum.valueOf(plage.jourSemaine);
            
            return formateur.getDisponibilites().stream()
                .anyMatch(d -> d.getJourSemaine() == jourEnum &&
                             !plage.heureDebut.isBefore(d.getHeureDebut()) &&
                             !plage.heureFin.isAfter(d.getHeureFin()) &&
                             d.getEstDisponible());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean estSalleCompatible(
            Salle salle,
            SessionFormation session,
            PlageHoraire plage,
            List<Affectation> affectations) {
        
        // Vérifier capacité
        if (session.getGroupe() != null && 
            session.getGroupe().getEffectif() > salle.getCapacite()) {
            return false;
        }
        
        // Vérifier si déjà affectée
        boolean dejaAffectee = affectations.stream()
            .anyMatch(a -> a.salle.getId() == salle.getId() && 
                          a.date.equals(plage.date) &&
                          chevauche(a.heureDebut, a.heureFin, plage.heureDebut, plage.heureFin));
        
        return !dejaAffectee;
    }

    private List<Materiel> trouverMaterielsDisponibles(
            SessionFormation session,
            PlageHoraire plage,
            List<Materiel> tousMateriels,
            List<Affectation> affectations) {
        
        if (session.getMaterielRequis() == null) {
            return new ArrayList<>();
        }
        
        List<Materiel> disponibles = new ArrayList<>();
        
        for (Materiel materielRequis : session.getMaterielRequis()) {
            // Compter combien d'affectations utilisent déjà ce matériel
            long nbUtilisations = affectations.stream()
                .filter(a -> a.date.equals(plage.date) &&
                            chevauche(a.heureDebut, a.heureFin, plage.heureDebut, plage.heureFin))
                .flatMap(a -> a.materiels.stream())
                .filter(m -> m.getId() == materielRequis.getId())
                .count();
            
            // Vérifier si encore disponible
            if (nbUtilisations < materielRequis.getQuantiteDisponible()) {
                disponibles.add(materielRequis);
            }
        }
        
        return disponibles;
    }

    /**
     * Vérifie si deux plages horaires se chevauchent
     */
    private boolean chevauche(LocalTime debut1, LocalTime fin1, LocalTime debut2, LocalTime fin2) {
        return !fin1.isBefore(debut2) && !debut1.isAfter(fin2);
    }

    /**
     * Backtracking pour résoudre les sessions difficiles
     */
    private List<SessionFormation> resoudreParBacktracking(
            List<SessionFormation> sessionsNonAssignees,
            List<PlageHoraire> plagesHoraires,
            List<Formateur> formateurs,
            List<Salle> salles,
            List<Materiel> materiels,
            List<Affectation> affectationsExistantes,
            Planning planning) {
        
        List<SessionFormation> resolues = new ArrayList<>();
        int iterations = 0;
        
        for (SessionFormation session : sessionsNonAssignees) {
            if (iterations >= MAX_BACKTRACKING_DEPTH) {
                break;
            }
            
            Affectation solution = backtrackingRecursif(
                session, plagesHoraires, formateurs, salles, materiels,
                affectationsExistantes, 0
            );
            
            if (solution != null) {
                // Créer le créneau
                Creneau creneau = creerCreneau(solution.date, solution.heureDebut, solution.heureFin);
                solution.creneau = creneau;
                
                affectationsExistantes.add(solution);
                appliquerAffectation(session, solution, planning);
                resolues.add(session);
            }
            
            iterations++;
        }
        
        return resolues;
    }

    /**
     * Backtracking récursif
     */
    private Affectation backtrackingRecursif(
            SessionFormation session,
            List<PlageHoraire> plagesHoraires,
            List<Formateur> formateurs,
            List<Salle> salles,
            List<Materiel> materiels,
            List<Affectation> affectationsExistantes,
            int profondeur) {
        
        if (profondeur > 10) {
            return null;
        }
        
        // Filtrer les plages compatibles
        List<PlageHoraire> plagesCompatibles = plagesHoraires.stream()
            .filter(p -> p.dureeMinutes >= session.getDuree())
            .collect(Collectors.toList());
        
        for (PlageHoraire plage : plagesCompatibles) {
            for (Formateur formateur : formateurs) {
                if (!estFormateurDisponible(formateur, plage, affectationsExistantes)) {
                    continue;
                }
                
                for (Salle salle : salles) {
                    if (!estSalleCompatible(salle, session, plage, affectationsExistantes)) {
                        continue;
                    }
                    
                    List<Materiel> materielsAffectes = trouverMaterielsDisponibles(
                        session, plage, materiels, affectationsExistantes
                    );
                    
                    Affectation candidate = new Affectation();
                    candidate.session = session;
                    candidate.date = plage.date;
                    candidate.heureDebut = plage.heureDebut;
                    candidate.heureFin = plage.heureDebut.plusMinutes(session.getDuree());
                    candidate.formateur = formateur;
                    candidate.salle = salle;
                    candidate.materiels = materielsAffectes;
                    candidate.score = calculerScore(session, plage, formateur, salle, materielsAffectes);
                    
                    if (candidate.score > 0.2) {
                        return candidate;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Optimisation locale par échanges
     */
    private void optimisationLocale(List<Affectation> affectations, Planning planning) {
        boolean amelioration = true;
        int iterations = 0;
        
        while (amelioration && iterations < MAX_LOCAL_OPTIMIZATION_ITERATIONS) {
            amelioration = false;
            
            for (int i = 0; i < affectations.size(); i++) {
                for (int j = i + 1; j < affectations.size(); j++) {
                    Affectation a1 = affectations.get(i);
                    Affectation a2 = affectations.get(j);
                    
                    double scoreAvant = a1.score + a2.score;
                    
                    // Échanger les dates et heures
                    LocalDate tempDate = a1.date;
                    LocalTime tempHeureDebut = a1.heureDebut;
                    LocalTime tempHeureFin = a1.heureFin;
                    
                    a1.date = a2.date;
                    a1.heureDebut = a2.heureDebut;
                    a1.heureFin = a2.heureFin;
                    
                    a2.date = tempDate;
                    a2.heureDebut = tempHeureDebut;
                    a2.heureFin = tempHeureFin;
                    
                    // Créer des plages temporaires pour le calcul
                    PlageHoraire plage1 = new PlageHoraire(a1.date, a1.heureDebut, 
                        (int) java.time.Duration.between(a1.heureDebut, a1.heureFin).toMinutes());
                    PlageHoraire plage2 = new PlageHoraire(a2.date, a2.heureDebut, 
                        (int) java.time.Duration.between(a2.heureDebut, a2.heureFin).toMinutes());
                    
                    double nouveauScore1 = calculerScore(
                        a1.session, plage1, a1.formateur, a1.salle, a1.materiels
                    );
                    double nouveauScore2 = calculerScore(
                        a2.session, plage2, a2.formateur, a2.salle, a2.materiels
                    );
                    
                    double scoreApres = nouveauScore1 + nouveauScore2;
                    
                    if (scoreApres > scoreAvant) {
                        a1.score = nouveauScore1;
                        a2.score = nouveauScore2;
                        amelioration = true;
                        
                        // Mettre à jour les créneaux en base
                        a1.creneau.setDate(a1.date);
                        a1.creneau.setHeureDebut(a1.heureDebut);
                        a1.creneau.setHeureFin(a1.heureFin);
                        creneauRepository.save(a1.creneau);
                        
                        a2.creneau.setDate(a2.date);
                        a2.creneau.setHeureDebut(a2.heureDebut);
                        a2.creneau.setHeureFin(a2.heureFin);
                        creneauRepository.save(a2.creneau);
                        
                        appliquerAffectation(a1.session, a1, planning);
                        appliquerAffectation(a2.session, a2, planning);
                    } else {
                        // Annuler l'échange
                        a1.date = a2.date;
                        a1.heureDebut = a2.heureDebut;
                        a1.heureFin = a2.heureFin;
                        a2.date = tempDate;
                        a2.heureDebut = tempHeureDebut;
                        a2.heureFin = tempHeureFin;
                    }
                }
            }
            
            iterations++;
        }
    }

    /**
     * Calcule le score global d'une liste d'affectations
     */
    private double calculerScoreGlobal(List<Affectation> affectations) {
        if (affectations.isEmpty()) {
            return 0.0;
        }
        return affectations.stream()
            .mapToDouble(a -> a.score)
            .average()
            .orElse(0.0);
    }
}