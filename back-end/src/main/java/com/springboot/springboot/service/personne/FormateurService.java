package com.springboot.springboot.service.personne;

import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.personne.Personne;
import com.springboot.springboot.entity.personne.Indisponibilite;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.personne.IndisponibiliteRepository;
import com.springboot.springboot.repository.planning.SessionFormationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service pour gérer les formateurs avec authentification
 */
@Service
public class FormateurService {

    @Autowired
    private FormateurRepository repository;
    
    @Autowired
    private IndisponibiliteRepository indisponibiliteRepository;
    
    @Autowired
    private SessionFormationRepository sessionRepository;
    
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Méthodes CRUD existantes
    public List<Formateur> findAll() {
        return repository.findAll();
    }

    public Optional<Formateur> findById(int id) {
        return repository.findById(id);
    }

    public Formateur save(Formateur formateur) {
        return repository.save(formateur);
    }

    public void deleteById(int id) {
        repository.deleteById(id);
    }
    
    /**
     * Trouve un formateur par email (pour login)
     */
    public Optional<Formateur> findByEmail(String email) {
        return repository.findByEmail(email);
    }
    
    /**
     * Crée un nouveau formateur avec mot de passe hashé
     */
    public Formateur createFormateur(Formateur formateur) {
        if (repository.existsByEmail(formateur.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }
        formateur.setPassword(passwordEncoder.encode(formateur.getPassword()));
        formateur.setRole(Personne.RoleEnum.FORMATEUR);
        formateur.setActif(true);
        return repository.save(formateur);
    }
    
    /**
     * Vérifie le mot de passe lors du login
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    /**
     * Récupère toutes les sessions d'un formateur
     */
    public List<SessionFormation> getSessionsByFormateurId(int formateurId) {
        return sessionRepository.findByFormateurId(formateurId);
    }
    
    /**
     * Récupère les sessions futures d'un formateur
     */
    public List<SessionFormation> getFutureSessionsByFormateur(int formateurId) {
        LocalDate today = LocalDate.now();
        return sessionRepository.findByFormateurIdAndDateDebutAfter(formateurId, today);
    }
    
    /**
     * Déclare une indisponibilité pour un formateur
     */
    public Indisponibilite declareIndisponibilite(int formateurId, Indisponibilite indispo) {
        indispo.setTypePersonne("FORMATEUR");
        indispo.setPersonneId(formateurId);
        indispo.setStatut("EN_ATTENTE");
        return indisponibiliteRepository.save(indispo);
    }
    
    /**
     * Récupère les indisponibilités d'un formateur
     */
    public List<Indisponibilite> getIndisponibilites(int formateurId) {
        return indisponibiliteRepository.findByTypePersonneAndPersonneId("FORMATEUR", formateurId);
    }
    
    /**
     * Valide un cours assigné au formateur
     */
    public SessionFormation validateCourse(int formateurId, int sessionId) {
        Optional<SessionFormation> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            SessionFormation session = sessionOpt.get();
            if (session.getFormateur().getId() == formateurId) {
                session.setStatut("VALIDEE");
                return sessionRepository.save(session);
            }
        }
        return null;
    }
}