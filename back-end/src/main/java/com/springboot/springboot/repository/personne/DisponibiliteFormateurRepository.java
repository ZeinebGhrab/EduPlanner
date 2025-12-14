package com.springboot.springboot.repository.personne;

import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.personne.DisponibiliteFormateur;
import com.springboot.springboot.entity.personne.DisponibiliteFormateur.JourEnum;

@Repository
public interface DisponibiliteFormateurRepository extends JpaRepository<DisponibiliteFormateur, Integer> {
    
    /**
     * Trouve toutes les disponibilités d'un formateur pour un jour donné
     */
    List<DisponibiliteFormateur> findByFormateurIdAndJourSemaine(int formateurId, JourEnum jourSemaine);
    
    /**
     * Vérifie si un formateur est disponible pour un créneau spécifique
     * Retourne les disponibilités qui couvrent le créneau demandé
     */
    @Query("SELECT d FROM DisponibiliteFormateur d WHERE d.formateur.id = :formateurId " +
           "AND d.jourSemaine = :jour " +
           "AND d.heureDebut <= :heureDebut " +
           "AND d.heureFin >= :heureFin")
    List<DisponibiliteFormateur> findDisponibilitesCouvrantCreneau(
            @Param("formateurId") int formateurId,
            @Param("jour") JourEnum jour,
            @Param("heureDebut") LocalTime heureDebut,
            @Param("heureFin") LocalTime heureFin);
}