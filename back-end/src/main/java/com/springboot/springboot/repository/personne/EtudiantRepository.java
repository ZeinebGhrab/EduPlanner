package com.springboot.springboot.repository.personne;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.personne.Etudiant;

import java.util.Optional;

/**
 * Repository pour les étudiants avec méthodes d'authentification
 */
@Repository
public interface EtudiantRepository extends JpaRepository<Etudiant, Integer> {
    
    /**
     * Trouve un étudiant par email (pour login)
     */
    Optional<Etudiant> findByEmail(String email);
    
    /**
     * Vérifie si un email existe déjà
     */
    boolean existsByEmail(String email);
}