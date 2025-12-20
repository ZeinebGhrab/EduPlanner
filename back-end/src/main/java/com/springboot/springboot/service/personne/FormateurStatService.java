package com.springboot.springboot.service.personne;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.springboot.dto.formateur.FormateurStatistiquesDTO;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.repository.planning.SessionRepository;

@Service
@Transactional(readOnly = true)
public class FormateurStatService {

    private final SessionRepository sessionRepository;

    public FormateurStatService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * ============================
     * Statistiques du formateur
     * ============================
     */
    public FormateurStatistiquesDTO getStatistiques(Long formateurId) {

        LocalDate today = LocalDate.now();
        LocalDate dateDebut = today.minusMonths(3); // étudiants actifs (3 mois)

        long sessionsAVenir = sessionRepository
                .countSessionsAVenirByFormateurId(formateurId, today);

        long sessionsTerminees = sessionRepository
                .countSessionsTermineesByFormateurId(formateurId, today);

        long etudiantsActifs = sessionRepository
                .countEtudiantsActifsByFormateurId(formateurId, dateDebut);

        return new FormateurStatistiquesDTO(
                sessionsAVenir,
                sessionsTerminees,
                etudiantsActifs
        );
    }

    /**
     * ============================
     * Sessions d'aujourd'hui
     * ============================
     */
    public List<SessionFormation> getSessionsAujourdhui(Long formateurId) {
        LocalDate today = LocalDate.now();
        return sessionRepository.findByFormateurIdAndDate(formateurId, today);
    }

    /**
     * ============================
     * Prochaines sessions (limit)
     * ============================
     */
    public List<SessionFormation> getUpcomingSessions(Long formateurId, int limit) {

        LocalDate today = LocalDate.now();
        List<SessionFormation> sessions =
                sessionRepository.findUpcomingSessionsByFormateurId(formateurId, today);

        return sessions.stream()
                .limit(limit)
                .toList();
    }
}
