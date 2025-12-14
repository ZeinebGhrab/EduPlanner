package com.springboot.springboot.service.planning;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.springboot.entity.contraintes.Contrainte;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.repository.planning.PlanningRepository;

import jakarta.transaction.Transactional;

@Service
public class PlanningService {

    @Autowired
    private PlanningRepository repository;

    /** Récupère tous les plannings avec sessions chargées */
    @Transactional
    public List<Planning> findAll() {
        List<Planning> plannings = repository.findAll();
        // Force l'initialisation des sessions et conflits
        plannings.forEach(p -> {
            p.getSessions().size();
            p.getConflits().size();
        });
        return plannings;
    }

    /** Récupère un planning par ID avec sessions et conflits initialisés */
    @Transactional
    public Optional<Planning> findById(int id) {
        Optional<Planning> opt = repository.findById(id);
        opt.ifPresent(p -> {
            p.getSessions().size();
            p.getConflits().size();
        });
        return opt;
    }

    @Transactional
    public Planning save(Planning planning) {
        return repository.save(planning);
    }

    @Transactional
    public void deleteById(int id) {
        repository.deleteById(id);
    }

    @Transactional
    public boolean ajouterSessionAvecConflits(int planningId, SessionFormation session, List<Contrainte> contraintes) {
        Optional<Planning> opt = repository.findById(planningId);
        if (opt.isPresent()) {
            Planning planning = opt.get();
            boolean success = planning.ajouterSessionAvecContraintes(session, contraintes);
            repository.save(planning);
            // Force l'initialisation des conflits
            planning.getConflits().size();
            return success;
        }
        return false;
    }

    @Transactional
    public void supprimerSession(int planningId, SessionFormation session) {
        Optional<Planning> opt = repository.findById(planningId);
        if (opt.isPresent()) {
            Planning planning = opt.get();
            planning.supprimerSession(session);
            repository.save(planning);
            // Force l'initialisation des sessions et conflits
            planning.getSessions().size();
            planning.getConflits().size();
        }
    }

    @Transactional
    public List<Conflit> detecterTousConflits(int planningId, List<Contrainte> contraintes) {
        Optional<Planning> opt = repository.findById(planningId);
        if (opt.isPresent()) {
            Planning planning = opt.get();
            planning.detecterTousConflits(contraintes);
            repository.save(planning);
            // Retourne une copie de la liste pour éviter Lazy init en dehors de la transaction
            return List.copyOf(planning.getConflits());
        }
        return List.of();
    }
    
    /**
     * Valider un planning (admin only)
     */
    @Transactional
    public Planning validerPlanning(int planningId, String adminUsername) {
        return repository.findById(planningId)
                .map(planning -> {
                    if (!"EN_COURS".equals(planning.getStatut())) {
                        throw new RuntimeException("Seul un planning EN_COURS peut être validé");
                    }
                    planning.setStatut("VALIDE");
                    planning.setDateValidation(LocalDate.now());
                    planning.setValidePar(adminUsername);
                    return repository.save(planning);
                })
                .orElseThrow(() -> new RuntimeException("Planning non trouvé"));
    }
    
    /**
     * Publier un planning (admin only)
     */
    @Transactional
    public Planning publierPlanning(int planningId) {
        return repository.findById(planningId)
                .map(planning -> {
                    if (!"VALIDE".equals(planning.getStatut())) {
                        throw new RuntimeException("Seul un planning VALIDE peut être publié");
                    }
                    planning.setStatut("PUBLIE");
                    planning.setDatePublication(LocalDate.now());
                    return repository.save(planning);
                })
                .orElseThrow(() -> new RuntimeException("Planning non trouvé"));
    }
}
