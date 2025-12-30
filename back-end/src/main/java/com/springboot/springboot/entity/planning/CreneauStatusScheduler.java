package com.springboot.springboot.entity.planning;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.springboot.springboot.repository.planning.CreneauRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class CreneauStatusScheduler {
    
    @Autowired
    private CreneauRepository creneauRepository;
    
    /**
     * Met à jour automatiquement les statuts des créneaux
     * S'exécute toutes les 5 minutes (300000 ms)
     */
    @Scheduled(fixedRate = 300000)
    public void updateCreneauStatuses() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        List<Creneau> creneaux = creneauRepository.findAll();
        int updated = 0;
        
        for (Creneau c : creneaux) {
            String newStatut;
            
            if (c.getDate() == null) {
                newStatut = "PLANIFIE";
            } else if (c.getDate().isBefore(today)) {
                newStatut = "TERMINE";
            } else if (c.getDate().isAfter(today)) {
                newStatut = "A_VENIR";
            } else { // c.getDate() == today
                if (now.isBefore(c.getHeureDebut())) {
                    newStatut = "A_VENIR";
                } else if (now.isAfter(c.getHeureFin())) {
                    newStatut = "TERMINE";
                } else {
                    newStatut = "EN_COURS";
                }
            }
            
            // Ne met à jour que si le statut a changé
            if (!newStatut.equals(c.getStatut())) {
                c.setStatut(newStatut);
                creneauRepository.save(c);
                updated++;
            }
        }
        
        if (updated > 0) {
            System.out.println("Mise à jour automatique : " + updated + " créneau(x) mis à jour");
        }
    }
    
    /**
     * Optionnel : S'exécute au démarrage de l'application
     * pour mettre à jour tous les statuts immédiatement
     */
    @Scheduled(initialDelay = 5000, fixedDelay = Long.MAX_VALUE)
    public void updateOnStartup() {
        System.out.println("Mise à jour initiale des statuts des créneaux...");
        updateCreneauStatuses();
    }
}