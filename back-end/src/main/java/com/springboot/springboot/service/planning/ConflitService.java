package com.springboot.springboot.service.planning;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.springboot.entity.personne.DisponibiliteFormateur;
import com.springboot.springboot.entity.personne.DisponibiliteFormateur.JourEnum;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.repository.personne.DisponibiliteFormateurRepository;
import com.springboot.springboot.repository.planning.ConflitRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;

@Service
public class ConflitService {

    @Autowired
    private ConflitRepository repository;
    
    @Autowired
    private SessionFormationRepository sessionRepository;
    
    @Autowired
    private DisponibiliteFormateurRepository disponibiliteRepository;

    public List<Conflit> findAll() {
        return repository.findAll();
    }

    public Optional<Conflit> findById(int id) {
        return repository.findById(id);
    }

    public Conflit save(Conflit conflit) {
        return repository.save(conflit);
    }

    public void deleteById(int id) {
        repository.deleteById(id);
    }
    
    /**
     * ✅ CORRIGÉ : Détecte les conflits pour une session donnée
     * Exclut la session elle-même lors de la vérification
     */
    public List<String> detecterConflits(SessionFormation session) {
        List<String> conflits = new ArrayList<>();

        if (session.getCreneaux() == null || session.getCreneaux().isEmpty()) {
            return conflits;
        }

        // Vérifier les conflits pour chaque créneau de la session
        for (Creneau creneau : session.getCreneaux()) {
            int creneauId = creneau.getId();
            String creneauInfo = String.format("%s de %s à %s", 
                creneau.getJourSemaine(), 
                creneau.getHeureDebut(), 
                creneau.getHeureFin());

            // 1. Vérifier la disponibilité du formateur
            if (session.getFormateur() != null && creneau.getJourSemaine() != null) {
                try {
                    JourEnum jour = JourEnum.valueOf(creneau.getJourSemaine().toUpperCase());
                    
                    List<DisponibiliteFormateur> disponibilites = disponibiliteRepository
                        .findDisponibilitesCouvrantCreneau(
                            session.getFormateur().getId(),
                            jour,
                            creneau.getHeureDebut(),
                            creneau.getHeureFin()
                        );
                    
                    if (disponibilites.isEmpty()) {
                        conflits.add(String.format(
                            "❌ DISPONIBILITÉ : Le formateur %s %s n'a pas déclaré de disponibilité pour le créneau %d (%s). " +
                            "Veuillez d'abord créer une disponibilité pour ce formateur à ce créneau.",
                            session.getFormateur().getPrenom(),
                            session.getFormateur().getNom(),
                            creneauId,
                            creneauInfo
                        ));
                    } else {
                        boolean auMoinsUneDisponible = disponibilites.stream()
                            .anyMatch(d -> d.getEstDisponible() != null && d.getEstDisponible());
                        
                        if (!auMoinsUneDisponible) {
                            conflits.add(String.format(
                                "❌ INDISPONIBILITÉ : Le formateur %s %s n'est PAS disponible (estDisponible = false) " +
                                "pour le créneau %d (%s). Il ne peut pas enseigner à ce moment.",
                                session.getFormateur().getPrenom(),
                                session.getFormateur().getNom(),
                                creneauId,
                                creneauInfo
                            ));
                        }
                    }
                } catch (IllegalArgumentException e) {
                    conflits.add(String.format(
                        "⚠️ ERREUR : Jour invalide '%s' dans le créneau %d",
                        creneau.getJourSemaine(),
                        creneauId
                    ));
                }
            }

            // ✅ 2. CORRIGÉ : Conflit formateur - EXCLURE LA SESSION ACTUELLE + SESSIONS EN CONFLIT
            if (session.getFormateur() != null && creneau.getDate() != null) {
                List<SessionFormation> sessionsFormateur = sessionRepository.findFormateurConflicts(
                    session.getFormateur().getId(),
                    creneau.getDate(),
                    creneau.getHeureDebut(),
                    creneau.getHeureFin()
                );
                
                // ✅ Filtrer pour exclure :
                // - La session actuelle
                // - Les sessions déjà en conflit
                long nbConflits = sessionsFormateur.stream()
                    .filter(s -> s.getId() != session.getId())
                    .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && !Boolean.TRUE.equals(s.getADesConflits()))
                    .count();
                
                if (nbConflits > 0) {
                    conflits.add(String.format(
                        "❌ CONFLIT FORMATEUR : Le formateur %s %s est déjà assigné à %d autre(s) session(s) VALIDE(s) " +
                        "au créneau %d (%s)",
                        session.getFormateur().getPrenom(),
                        session.getFormateur().getNom(),
                        nbConflits,
                        creneauId,
                        creneauInfo
                    ));
                }
            }

            // ✅ 3. CORRIGÉ : Conflit salle - EXCLURE LA SESSION ACTUELLE + SESSIONS EN CONFLIT
            if (session.getSalle() != null && creneau.getDate() != null) {
                List<SessionFormation> sessionsSalle = sessionRepository.findSalleConflicts(
                    session.getSalle().getId(),
                    creneau.getDate(),
                    creneau.getHeureDebut(),
                    creneau.getHeureFin()
                );
                
                // ✅ Filtrer pour exclure :
                // - La session actuelle
                // - Les sessions déjà en conflit
                long nbConflits = sessionsSalle.stream()
                    .filter(s -> s.getId() != session.getId())
                    .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && !Boolean.TRUE.equals(s.getADesConflits()))
                    .count();
                
                if (nbConflits > 0) {
                    conflits.add(String.format(
                        "❌ CONFLIT SALLE : La salle '%s' (bâtiment %s) est déjà utilisée par %d autre(s) session(s) VALIDE(s) " +
                        "au créneau %d (%s)",
                        session.getSalle().getNom(),
                        session.getSalle().getBatiment(),
                        nbConflits,
                        creneauId,
                        creneauInfo
                    ));
                }
            }
            
            // ✅ 4. CORRIGÉ : Conflit groupe - EXCLURE LA SESSION ACTUELLE + SESSIONS EN CONFLIT
            if (session.getGroupe() != null && creneau.getDate() != null) {
                List<SessionFormation> sessionsGroupe = sessionRepository.findGroupeConflicts(
                    session.getGroupe().getId(),
                    creneau.getDate(),
                    creneau.getHeureDebut(),
                    creneau.getHeureFin()
                );
                
                // ✅ Filtrer pour exclure :
                // - La session actuelle
                // - Les sessions déjà en conflit
                long nbConflits = sessionsGroupe.stream()
                    .filter(s -> s.getId() != session.getId())
                    .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && !Boolean.TRUE.equals(s.getADesConflits()))
                    .count();
                
                if (nbConflits > 0) {
                    conflits.add(String.format(
                        "❌ CONFLIT GROUPE : Le groupe '%s' (code: %s) a déjà %d autre(s) session(s) VALIDE(s) prévue(s) " +
                        "au créneau %d (%s)",
                        session.getGroupe().getNom(),
                        session.getGroupe().getCode(),
                        nbConflits,
                        creneauId,
                        creneauInfo
                    ));
                }
            }
            
            // ✅ 5. CORRIGÉ : Conflit matériel - EXCLURE LA SESSION ACTUELLE + SESSIONS EN CONFLIT
            if (session.getMaterielRequis() != null) {
                session.getMaterielRequis().forEach(materiel -> {
                    // ✅ Récupérer toutes les sessions qui utilisent ce matériel dans ce créneau
                    List<SessionFormation> sessionsUtilisant = sessionRepository.findByCreneauId(creneauId).stream()
                        .filter(s -> s.getMaterielRequis() != null && 
                                    s.getMaterielRequis().stream()
                                        .anyMatch(m -> m.getId() == materiel.getId()))
                        .filter(s -> s.getId() != session.getId()) // ✅ Exclure session actuelle
                        .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && !Boolean.TRUE.equals(s.getADesConflits())) // ✅ Exclure sessions en conflit
                        .toList();
                    
                    long nbSessionsUtilisant = sessionsUtilisant.size();
                    int capacite = materiel.getQuantiteDisponible();
                    
                    if (nbSessionsUtilisant >= capacite) {
                        conflits.add(String.format(
                            "❌ CAPACITÉ MATÉRIEL DÉPASSÉE : %s a une capacité de %d unité(s), " +
                            "mais %d session(s) VALIDE(s) l'utilisent déjà au créneau %d (%s). " +
                            "Impossible d'ajouter une nouvelle session.",
                            materiel.getNom(),
                            capacite,
                            nbSessionsUtilisant,
                            creneauId,
                            creneauInfo
                        ));
                    } else if (nbSessionsUtilisant > 0) {
                        conflits.add(String.format(
                            "⚠️ AVERTISSEMENT MATÉRIEL : %s est déjà utilisé par %d session(s) VALIDE(s) " +
                            "au créneau %d (%s). Capacité restante : %d/%d",
                            materiel.getNom(),
                            nbSessionsUtilisant,
                            creneauId,
                            creneauInfo,
                            (capacite - nbSessionsUtilisant),
                            capacite
                        ));
                    }
                });
            }
        }

        return conflits;
    }
}