package com.springboot.springboot.service.planning;

import java.time.LocalDate;
import java.time.LocalTime;
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
     * Détecte les conflits pour une session donnée.
     * Retourne une liste de descriptions des conflits détectés.
     */
    public List<String> detecterConflits(SessionFormation session) {
        List<String> conflits = new ArrayList<>();

        if (session.getCreneaux() == null || session.getCreneaux().isEmpty()) {
            return conflits; // Pas de créneau, pas de conflit à détecter
        }

        // Vérifier les conflits pour chaque créneau de la session
        for (Creneau creneau : session.getCreneaux()) {
            int creneauId = creneau.getId();
            String creneauInfo = String.format("%s de %s à %s", 
                creneau.getJourSemaine(), 
                creneau.getHeureDebut(), 
                creneau.getHeureFin());

            // 0. NOUVEAU : Vérifier la disponibilité du formateur
            if (session.getFormateur() != null && creneau.getJourSemaine() != null) {
                try {
                    JourEnum jour = JourEnum.valueOf(creneau.getJourSemaine().toUpperCase());
                    
                    // Chercher les disponibilités du formateur qui couvrent ce créneau
                    List<DisponibiliteFormateur> disponibilites = disponibiliteRepository
                        .findDisponibilitesCouvrantCreneau(
                            session.getFormateur().getId(),
                            jour,
                            creneau.getHeureDebut(),
                            creneau.getHeureFin()
                        );
                    
                    // Si aucune disponibilité trouvée
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
                        // Vérifier si au moins une disponibilité a estDisponible = true
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
                    // Jour invalide dans le créneau
                    conflits.add(String.format(
                        "⚠️ ERREUR : Jour invalide '%s' dans le créneau %d",
                        creneau.getJourSemaine(),
                        creneauId
                    ));
                }
            }

            // 1. Conflit formateur : même formateur au même créneau (déjà assigné ailleurs)
            if (session.getFormateur() != null) {
                boolean formateurConflit = sessionRepository.existsByCreneauIdAndFormateurId(
                        creneauId,
                        session.getFormateur().getId()
                );
                if (formateurConflit) {
                    conflits.add(String.format(
                        "❌ CONFLIT FORMATEUR : Le formateur %s %s est déjà assigné à une autre session " +
                        "au créneau %d (%s)",
                        session.getFormateur().getPrenom(),
                        session.getFormateur().getNom(),
                        creneauId,
                        creneauInfo
                    ));
                }
            }

            // 2. Conflit salle : même salle au même créneau
            if (session.getSalle() != null) {
                boolean salleConflit = sessionRepository.existsByCreneauIdAndSalleId(
                        creneauId,
                        session.getSalle().getId()
                );
                if (salleConflit) {
                    conflits.add(String.format(
                        "❌ CONFLIT SALLE : La salle '%s' (bâtiment %s) est déjà utilisée " +
                        "au créneau %d (%s)",
                        session.getSalle().getNom(),
                        session.getSalle().getBatiment(),
                        creneauId,
                        creneauInfo
                    ));
                }
            }
            
            // 3. Conflit groupe : même groupe au même créneau
            if (session.getGroupe() != null) {
                boolean groupeConflit = sessionRepository.existsByCreneauIdAndGroupeId(
                        creneauId,
                        session.getGroupe().getId()
                );
                if (groupeConflit) {
                    conflits.add(String.format(
                        "❌ CONFLIT GROUPE : Le groupe '%s' (code: %s) a déjà une session prévue " +
                        "au créneau %d (%s)",
                        session.getGroupe().getNom(),
                        session.getGroupe().getCode(),
                        creneauId,
                        creneauInfo
                    ));
                }
            }
            
            // 4. Conflit matériel : même matériel au même créneau
            if (session.getMaterielRequis() != null) {
                session.getMaterielRequis().forEach(materiel -> {
                    // Compter combien de sessions utilisent déjà ce matériel dans ce créneau
                    long nbSessionsUtilisant = sessionRepository.countSessionsUsingMaterielInCreneau(
                            creneauId,
                            materiel.getId()
                    );
                    
                    // Vérifier si la capacité est dépassée (nb sessions + 1 nouvelle > quantité disponible)
                    int capacite = materiel.getQuantiteDisponible();
                    if (nbSessionsUtilisant >= capacite) {
                        conflits.add(String.format(
                            "❌ CAPACITÉ MATÉRIEL DÉPASSÉE : %s a une capacité de %d unité(s), " +
                            "mais %d session(s) l'utilisent déjà au créneau %d (%s). " +
                            "Impossible d'ajouter une nouvelle session.",
                            materiel.getNom(),
                            capacite,
                            nbSessionsUtilisant,
                            creneauId,
                            creneauInfo
                        ));
                    } else if (nbSessionsUtilisant > 0) {
                        // Avertissement si le matériel est déjà utilisé mais capacité non dépassée
                        conflits.add(String.format(
                            "⚠️ AVERTISSEMENT MATÉRIEL : %s est déjà utilisé par %d session(s) " +
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