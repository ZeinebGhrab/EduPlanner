package com.springboot.springboot.service.planning;

import com.springboot.springboot.entity.personne.DisponibiliteFormateur;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.personne.DisponibiliteFormateurRepository;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.planning.CreneauRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import com.springboot.springboot.repository.ressources.SalleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * Service dédié à la résolution des conflits de planning
 */
@Service
public class PlanningResolutionService {

    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private FormateurRepository formateurRepository;
    
    @Autowired
    private SalleRepository salleRepository;
    
    @Autowired
    private CreneauRepository creneauRepository;
    
    @Autowired
    private DisponibiliteFormateurRepository disponibiliteRepository;

    /**
     * Change le créneau complet d'une session
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean changerCreneauComplet(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            int nouveauCreneauId = (Integer) data.get("nouveauCreneauId");
            
            SessionFormation session = sessionRepository.findById(sessionId).orElse(null);
            if (session == null) return false;
            
            Creneau nouveauCreneau = creneauRepository.findById(nouveauCreneauId).orElse(null);
            if (nouveauCreneau == null) return false;
            
            session.setCreneaux(List.of(nouveauCreneau));
            
            if (nouveauCreneau.getDate() != null) {
                session.setDateDebut(nouveauCreneau.getDate());
                session.setDateFin(nouveauCreneau.getDate());
            }
            
            sessionRepository.save(session);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Change le formateur d'une session
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean changerFormateur(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            List<Map<String, Object>> options = (List<Map<String, Object>>) data.get("options");
            if (options == null || options.isEmpty()) return false;
            
            int nouveauFormateurId = (Integer) options.get(0).get("id");
            
            SessionFormation session = sessionRepository.findById(sessionId).orElse(null);
            if (session == null) return false;
            
            Formateur nouveauFormateur = formateurRepository.findById(nouveauFormateurId).orElse(null);
            if (nouveauFormateur == null) return false;
            
            session.setFormateur(nouveauFormateur);
            sessionRepository.save(session);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Change la salle d'une session
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean changerSalle(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            List<Map<String, Object>> options = (List<Map<String, Object>>) data.get("options");
            if (options == null || options.isEmpty()) return false;
            
            int nouvelleSalleId = (Integer) options.get(0).get("id");
            
            SessionFormation session = sessionRepository.findById(sessionId).orElse(null);
            if (session == null) return false;
            
            Salle nouvelleSalle = salleRepository.findById(nouvelleSalleId).orElse(null);
            if (nouvelleSalle == null) return false;
            
            session.setSalle(nouvelleSalle);
            sessionRepository.save(session);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Change le créneau d'une session
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean changerCreneau(Map<String, Object> data) {
        try {
            int sessionId = (Integer) data.get("sessionId");
            List<Map<String, Object>> options = (List<Map<String, Object>>) data.get("options");
            if (options == null || options.isEmpty()) return false;
            
            int nouveauCreneauId = (Integer) options.get(0).get("id");
            
            SessionFormation session = sessionRepository.findById(sessionId).orElse(null);
            if (session == null) return false;
            
            Creneau nouveauCreneau = creneauRepository.findById(nouveauCreneauId).orElse(null);
            if (nouveauCreneau == null) return false;
            
            session.setCreneaux(List.of(nouveauCreneau));
            sessionRepository.save(session);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Crée une nouvelle disponibilité pour un formateur
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean creerDisponibilite(Map<String, Object> data) {
        try {
            int formateurId = (Integer) data.get("formateurId");
            String jourSemaine = (String) data.get("jourSemaine");
            String heureDebut = (String) data.get("heureDebut");
            String heureFin = (String) data.get("heureFin");
            
            Formateur formateur = formateurRepository.findById(formateurId).orElse(null);
            if (formateur == null) return false;
            
            DisponibiliteFormateur dispo = new DisponibiliteFormateur();
            dispo.setFormateur(formateur);
            dispo.setJourSemaine(DisponibiliteFormateur.JourEnum.valueOf(jourSemaine.toUpperCase()));
            dispo.setHeureDebut(LocalTime.parse(heureDebut));
            dispo.setHeureFin(LocalTime.parse(heureFin));
            dispo.setEstDisponible(true);
            
            disponibiliteRepository.save(dispo);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Corrige la date d'un créneau pour qu'elle soit dans la semaine du planning
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean corrigerDateCreneau(Map<String, Object> data) {
        try {
            int creneauId = (Integer) data.get("creneauId");
            String planningSemaine = (String) data.get("planningSemaine");
            String jourSemaine = (String) data.get("jourSemaine");
            
            Creneau creneau = creneauRepository.findById(creneauId).orElse(null);
            if (creneau == null) return false;
            
            LocalDate debutSemaine = LocalDate.parse(planningSemaine);
            
            while (debutSemaine.getDayOfWeek() != DayOfWeek.MONDAY) {
                debutSemaine = debutSemaine.minusDays(1);
            }
            
            LocalDate nouvelleDate = calculerDateDepuisJour(debutSemaine, jourSemaine);
            
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
     * Corrige le jour d'un créneau pour qu'il corresponde à sa date
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean corrigerJourCreneau(Map<String, Object> data) {
        try {
            int creneauId = (Integer) data.get("creneauId");
            
            Creneau creneau = creneauRepository.findById(creneauId).orElse(null);
            if (creneau == null || creneau.getDate() == null) return false;
            
            // Calculer le jour à partir de la date
            String jourCorrect = obtenirJourSemaineDepuisDate(creneau.getDate());
            
            creneau.setJourSemaine(jourCorrect);
            creneauRepository.save(creneau);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Obtient le jour de la semaine à partir d'une date
     */
    private String obtenirJourSemaineDepuisDate(LocalDate date) {
        switch (date.getDayOfWeek()) {
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
}