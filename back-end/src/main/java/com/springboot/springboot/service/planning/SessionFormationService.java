// back-end/src/main/java/com/springboot/springboot/service/planning/SessionFormationService.java

package com.springboot.springboot.service.planning;

import com.springboot.springboot.dto.conflit.ConflitDTO;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.repository.planning.ConflitRepository;
import com.springboot.springboot.repository.planning.CreneauRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SessionFormationService {

    private final SessionFormationRepository sessionRepository;
    private final ConflitRepository conflitRepository;
    private final ConflitService conflitService;
    private final CreneauRepository creneauRepository;

    @Autowired
    public SessionFormationService(SessionFormationRepository sessionRepository,
                                   ConflitRepository conflitRepository,
                                   ConflitService conflitService,
                                   CreneauRepository creneauRepository) {
        this.sessionRepository = sessionRepository;
        this.conflitRepository = conflitRepository;
        this.conflitService = conflitService;
        this.creneauRepository = creneauRepository;
    }

    /* =========================================================
       🔍 LECTURE SIMPLE (LISTE)
       ========================================================= */

    @Transactional(readOnly = true)
    public List<SessionFormation> findAll() {
        return sessionRepository.findAll();
    }

    /* =========================================================
       🔍 LECTURE DÉTAILLÉE (UNE SESSION)
       ========================================================= */

    @Transactional(readOnly = true)
    public SessionFormation findById(int id) {
        return sessionRepository.findByIdComplet(id)
            .orElseThrow(() ->
                new RuntimeException("Session introuvable avec ID : " + id)
            );
    }

    /* =========================================================
       🧠 DÉTERMINATION DU TYPE DE CONFLIT
       ========================================================= */

    private Conflit.TypeConflit determineTypeConflit(String description) {
        String desc = description.toLowerCase();
        if (desc.contains("formateur") || desc.contains("disponibilité")) {
            return Conflit.TypeConflit.CONFLIT_FORMATEUR;
        } else if (desc.contains("salle")) {
            return Conflit.TypeConflit.CONFLIT_SALLE;
        } else if (desc.contains("materiel") || desc.contains("matériel")) {
            return Conflit.TypeConflit.CONFLIT_MATERIEL;
        } else if (desc.contains("groupe")) {
            return Conflit.TypeConflit.CONFLIT_GROUPE;
        } else if (desc.contains("contrainte") || desc.contains("date") || desc.contains("semaine")) {
            return Conflit.TypeConflit.CONTRAINTE_NON_RESPECTEE;
        } else {
            return Conflit.TypeConflit.CHEVAUCHEMENT_SESSION;
        }
    }

    /* =========================================================
       📅 VALIDATION & CORRECTION DES CRÉNEAUX
       ========================================================= */

    private void validerEtCorrigerDatesCreneaux(SessionFormation session) {

        if (session.getPlanning() == null || session.getPlanning().getSemaine() == null) {
            return;
        }

        if (session.getCreneaux() == null || session.getCreneaux().isEmpty()) {
            return;
        }

        // S'assurer que debutSemaine est bien le lundi
        LocalDate debutSemaine = session.getPlanning().getSemaine().with(DayOfWeek.MONDAY);
        LocalDate finSemaine = debutSemaine.plusDays(6);

        for (Creneau creneau : session.getCreneaux()) {

            if (creneau.getDate() == null) {
                if (creneau.getJourSemaine() == null) {
                    throw new RuntimeException(
                        "Le créneau doit avoir une date ou un jour de semaine"
                    );
                }

                LocalDate dateCalculee = calculerDateDepuisJourSemaine(debutSemaine, creneau.getJourSemaine());
                creneau.setDate(dateCalculee);
                creneau.setJourSemaine(obtenirJourSemaine(dateCalculee));
                creneauRepository.save(creneau);

            } else {
                LocalDate date = creneau.getDate();

                if (date.isBefore(debutSemaine) || date.isAfter(finSemaine)) {
                    throw new RuntimeException(
                        "❌ Date du créneau hors semaine du planning : " + date + 
                        " (semaine attendue : " + debutSemaine + " à " + finSemaine + ")"
                    );
                }

                String jourCalcule = obtenirJourSemaine(date);
                if (creneau.getJourSemaine() == null) {
                    creneau.setJourSemaine(jourCalcule);
                    creneauRepository.save(creneau);
                } else {
                    String jourSession = creneau.getJourSemaine().trim().toUpperCase();
                    if (!jourSession.equals(jourCalcule)) {
                        throw new RuntimeException(
                            "❌ Incohérence jour/date du créneau : attendu " + jourCalcule + ", trouvé " + creneau.getJourSemaine()
                        );
                    }
                }
            }
        }
    }

    private LocalDate calculerDateDepuisJourSemaine(LocalDate debutSemaine, String jourSemaine) {
        DayOfWeek day = convertirJourSemaine(jourSemaine);
        int decalage = day.getValue() - DayOfWeek.MONDAY.getValue();
        return debutSemaine.plusDays(decalage);
    }

    private String obtenirJourSemaine(LocalDate date) {
        switch (date.getDayOfWeek()) {
            case MONDAY: return "LUNDI";
            case TUESDAY: return "MARDI";
            case WEDNESDAY: return "MERCREDI";
            case THURSDAY: return "JEUDI";
            case FRIDAY: return "VENDREDI";
            case SATURDAY: return "SAMEDI";
            case SUNDAY: return "DIMANCHE";
            default: return date.getDayOfWeek().name();
        }
    }

    private DayOfWeek convertirJourSemaine(String jour) {
        String j = jour.trim().toUpperCase();
        switch (j) {
            case "LUNDI": return DayOfWeek.MONDAY;
            case "MARDI": return DayOfWeek.TUESDAY;
            case "MERCREDI": return DayOfWeek.WEDNESDAY;
            case "JEUDI": return DayOfWeek.THURSDAY;
            case "VENDREDI": return DayOfWeek.FRIDAY;
            case "SAMEDI": return DayOfWeek.SATURDAY;
            case "DIMANCHE": return DayOfWeek.SUNDAY;
            default: return DayOfWeek.valueOf(j);
        }
    }

    /* =========================================================
       💾 SAUVEGARDE AVEC GESTION DES CONFLITS (VERSION CORRIGÉE)
       ========================================================= */

    @Transactional
    public List<ConflitDTO> saveAvecConflit(SessionFormation session) {
        
        List<ConflitDTO> conflitsDTO = new ArrayList<>();
        
        // ✅ ÉTAPE 1 : Définir le statut initial
        if (session.getStatut() == null || session.getStatut().isEmpty()) {
            session.setStatut("EN_CREATION");
        }
        session.setADesConflits(false);
        
        // ✅ ÉTAPE 2 : SAUVEGARDER LA SESSION D'ABORD (sans validation)
        sessionRepository.save(session);
        
        // ✅ ÉTAPE 3 : Sauvegarder les créneaux
        if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
            for (Creneau creneau : session.getCreneaux()) {
                creneauRepository.save(creneau);
            }
        }

        // ✅ ÉTAPE 4 : Valider et corriger les dates des créneaux
        try {
            validerEtCorrigerDatesCreneaux(session);
        } catch (RuntimeException e) {
            // ✅ La session existe déjà, on peut créer le conflit
            session.setStatut("EN_CONFLIT");
            session.setADesConflits(true);
            sessionRepository.save(session);
            
            Conflit conflit = new Conflit();
            conflit.setDescription(e.getMessage());
            conflit.setSeverite(5);
            conflit.setType(Conflit.TypeConflit.CONTRAINTE_NON_RESPECTEE);

            if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
                conflit.setCreneau(session.getCreneaux().get(0));
            }
            
            // ✅ LIER LE CONFLIT À LA SESSION
            conflit.setSessionsImpliquees(List.of(session));

            conflitRepository.save(conflit);
            conflitsDTO.add(ConflitDTO.fromEntity(conflit));
            
            return conflitsDTO;
        }

        // ✅ ÉTAPE 5 : Détecter les autres conflits
        List<String> conflitsDetectes = conflitService.detecterConflits(session);

        if (!conflitsDetectes.isEmpty()) {
            // ✅ Marquer la session comme EN_CONFLIT
            session.setStatut("EN_CONFLIT");
            session.setADesConflits(true);
            sessionRepository.save(session);
            
            List<Conflit> conflits = conflitsDetectes.stream().map(desc -> {
                Conflit c = new Conflit();
                c.setDescription(desc);
                c.setSeverite(calculerSeverite(desc));
                c.setType(determineTypeConflit(desc));

                if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
                    c.setCreneau(session.getCreneaux().get(0));
                }
                
                // ✅ LIER LE CONFLIT À LA SESSION
                c.setSessionsImpliquees(List.of(session));
                
                return c;
            }).collect(Collectors.toList());

            conflitRepository.saveAll(conflits);
            
            conflitsDTO = conflits.stream()
                    .map(ConflitDTO::fromEntity)
                    .collect(Collectors.toList());
            
            return conflitsDTO;
        }

        // ✅ ÉTAPE 6 : Pas de conflit, session VALIDE
        session.setStatut("VALIDE");
        session.setADesConflits(false);
        sessionRepository.save(session);

        return conflitsDTO;
    }
    
    /**
     * Calcule la sévérité d'un conflit selon sa description
     */
    private int calculerSeverite(String description) {
        String desc = description.toLowerCase();
        
        if (desc.contains("disponibilité") || desc.contains("indisponibilité")) {
            return 5; // Critique
        } else if (desc.contains("capacité dépassée")) {
            return 4; // Très important
        } else if (desc.contains("déjà utilisé") || desc.contains("déjà assigné")) {
            return 3; // Important
        } else if (desc.contains("avertissement")) {
            return 2; // Moyen
        } else {
            return 1; // Faible
        }
    }

    /* =========================================================
       🗑️ SUPPRESSION
       ========================================================= */

    @Transactional
    public void deleteById(int id) {
        if (!sessionRepository.existsById(id)) {
            throw new RuntimeException("Session introuvable avec ID : " + id);
        }
        
        // ✅ Supprimer d'abord les conflits liés
        List<Conflit> conflits = conflitRepository.findAll().stream()
            .filter(c -> c.getSessionsImpliquees() != null && 
                        c.getSessionsImpliquees().stream().anyMatch(s -> s.getId() == id))
            .collect(Collectors.toList());
        
        conflitRepository.deleteAll(conflits);
        
        // Ensuite supprimer la session
        sessionRepository.deleteById(id);
    }

    /* =========================================================
       🔎 RECHERCHES
       ========================================================= */

    public List<SessionFormation> findByFormateurId(int id) {
        return sessionRepository.findByFormateurId(id);
    }

    public List<SessionFormation> findBySalleId(int id) {
        return sessionRepository.findBySalleId(id);
    }

    public List<SessionFormation> findByGroupeId(int id) {
        return sessionRepository.findByGroupeId(id);
    }

    public List<SessionFormation> findByCreneauId(int id) {
        return sessionRepository.findByCreneauId(id);
    }
    
    /* =========================================================
       ✅ MÉTHODES UTILITAIRES POUR LA GESTION DES CONFLITS
       ========================================================= */
    
    /**
     * Marque une session comme résolue (tous ses conflits sont résolus)
     */
    @Transactional
    public void marquerSessionResolue(int sessionId) {
        SessionFormation session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session introuvable"));
        
        session.setStatut("VALIDE");
        session.setADesConflits(false);
        sessionRepository.save(session);
    }
    
    /**
     * Récupère toutes les sessions en conflit
     */
    @Transactional(readOnly = true)
    public List<SessionFormation> findSessionsEnConflit() {
        return sessionRepository.findAll().stream()
            .filter(s -> "EN_CONFLIT".equals(s.getStatut()) || 
                        Boolean.TRUE.equals(s.getADesConflits()))
            .collect(Collectors.toList());
    }
}
