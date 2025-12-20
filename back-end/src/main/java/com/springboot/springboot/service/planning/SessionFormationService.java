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
        // ✅ PAS de forçage lazy ici
        return sessionRepository.findAll();
    }

    /* =========================================================
       🔍 LECTURE DÉTAILLÉE (UNE SESSION)
       ========================================================= */

    @Transactional(readOnly = true)
    public SessionFormation findById(int id) {
        // ✅ Utilise la requête JOIN FETCH
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
        if (desc.contains("formateur")) {
            return Conflit.TypeConflit.CONFLIT_FORMATEUR;
        } else if (desc.contains("salle")) {
            return Conflit.TypeConflit.CONFLIT_SALLE;
        } else if (desc.contains("materiel")) {
            return Conflit.TypeConflit.CONFLIT_MATERIEL;
        } else if (desc.contains("groupe")) {
            return Conflit.TypeConflit.CONFLIT_GROUPE;
        } else if (desc.contains("contrainte")) {
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
                // Normaliser le jourSemaine
                creneau.setJourSemaine(obtenirJourSemaine(dateCalculee));
                creneauRepository.save(creneau);

            } else {
                LocalDate date = creneau.getDate();

                if (date.isBefore(debutSemaine) || date.isAfter(finSemaine)) {
                    throw new RuntimeException(
                        "❌ Date du créneau hors semaine du planning : " + date
                    );
                }

                String jourCalcule = obtenirJourSemaine(date);
                if (creneau.getJourSemaine() == null) {
                    creneau.setJourSemaine(jourCalcule);
                    creneauRepository.save(creneau);
                } else {
                    // Normaliser pour comparaison
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
            default: return DayOfWeek.valueOf(j); // fallback si déjà en anglais
        }
    }



    /* =========================================================
       💾 SAUVEGARDE AVEC GESTION DES CONFLITS
       ========================================================= */

    @Transactional
    public List<ConflitDTO> saveAvecConflit(SessionFormation session) {

        List<ConflitDTO> conflitsDTO = new ArrayList<>();

        try {
            // Valider et corriger les dates des créneaux
            validerEtCorrigerDatesCreneaux(session);
        } catch (RuntimeException e) {
            // Création d'un conflit lié au premier créneau disponible si possible
            Conflit conflit = new Conflit();
            conflit.setDescription(e.getMessage());
            conflit.setSeverite(5);
            conflit.setType(Conflit.TypeConflit.CONTRAINTE_NON_RESPECTEE);

            if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
                conflit.setCreneau(session.getCreneaux().get(0));
            }

            conflitRepository.save(conflit);
            conflitsDTO.add(ConflitDTO.fromEntity(conflit));
            return conflitsDTO;
        }

        // Détecter les conflits via le service
        List<String> conflitsDetectes = conflitService.detecterConflits(session);

        if (!conflitsDetectes.isEmpty()) {
            List<Conflit> conflits = conflitsDetectes.stream().map(desc -> {
                Conflit c = new Conflit();
                c.setDescription(desc);
                c.setSeverite(1);
                c.setType(determineTypeConflit(desc));

                // Associer le conflit au créneau correspondant si possible
                if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
                    // Ici tu peux affiner pour trouver le créneau exact selon le conflit
                    c.setCreneau(session.getCreneaux().get(0));
                }

                return c;
            }).collect(Collectors.toList());

            return conflitRepository.saveAll(conflits)
                    .stream()
                    .map(ConflitDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        // Pas de conflit : sauvegarde de la session et de ses créneaux
        sessionRepository.save(session);
        if (session.getCreneaux() != null) {
            session.getCreneaux().forEach(creneauRepository::save);
        }

        return conflitsDTO;
    }


    /* =========================================================
       🗑️ SUPPRESSION
       ========================================================= */

    @Transactional
    public void deleteById(int id) {
        if (!sessionRepository.existsById(id)) {
            throw new RuntimeException("Session introuvable avec ID : " + id);
        }
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
}
