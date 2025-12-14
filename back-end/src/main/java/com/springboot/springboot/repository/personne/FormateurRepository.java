package com.springboot.springboot.repository.personne;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.personne.Formateur;

import java.util.Optional;

/**
 * Repository pour les formateurs avec méthodes d'authentification
 */
@Repository
public interface FormateurRepository extends JpaRepository<Formateur, Integer> {
    
    /**
     * Trouve un formateur par email (pour login)
     */
    Optional<Formateur> findByEmail(String email);
    
    /**
     * Vérifie si un email existe déjà
     */
    boolean existsByEmail(String email);
}