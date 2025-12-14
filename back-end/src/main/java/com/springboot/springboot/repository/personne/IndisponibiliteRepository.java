package com.springboot.springboot.repository.personne;

import com.springboot.springboot.entity.personne.Indisponibilite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository pour les indisponibilités des formateurs et étudiants
 */
@Repository
public interface IndisponibiliteRepository extends JpaRepository<Indisponibilite, Integer> {
    
    /**
     * Trouve toutes les indisponibilités d'une personne
     */
    @Query("SELECT i FROM Indisponibilite i WHERE i.typePersonne = :type AND i.personneId = :id")
    List<Indisponibilite> findByTypePersonneAndPersonneId(String type, int id);
    
    /**
     * Trouve les indisponibilités d'une personne pour une date donnée
     */
    @Query("SELECT i FROM Indisponibilite i WHERE i.typePersonne = :type AND i.personneId = :id AND i.dateIndispo = :date")
    List<Indisponibilite> findByTypePersonneAndPersonneIdAndDate(String type, int id, LocalDate date);
    
    /**
     * Trouve toutes les indisponibilités en attente de validation
     */
    List<Indisponibilite> findByStatut(String statut);
}
