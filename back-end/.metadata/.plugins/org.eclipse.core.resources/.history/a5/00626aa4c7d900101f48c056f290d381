package com.springboot.springboot.repository.planning;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.planning.SessionFormation;

@Repository
public interface SessionFormationRepository extends JpaRepository<SessionFormation, Integer> {
	
    // Vérifie si un formateur est déjà assigné à un créneau
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM SessionFormation s " +
           "JOIN s.creneaux c WHERE c.id = :creneauId AND s.formateur.id = :formateurId")
    boolean existsByCreneauIdAndFormateurId(@Param("creneauId") int creneauId, @Param("formateurId") int formateurId);

    // Vérifie si une salle est déjà utilisée à un créneau
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM SessionFormation s " +
           "JOIN s.creneaux c WHERE c.id = :creneauId AND s.salle.id = :salleId")
    boolean existsByCreneauIdAndSalleId(@Param("creneauId") int creneauId, @Param("salleId") int salleId);

    // Vérifie si un matériel est déjà utilisé à un créneau
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM SessionFormation s " +
           "JOIN s.creneaux c JOIN s.materielRequis m WHERE c.id = :creneauId AND m.id = :materielId")
    boolean existsByCreneauIdAndMaterielRequisId(@Param("creneauId") int creneauId, @Param("materielId") int materielId);

    // Vérifie si un groupe est déjà occupé à un créneau
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM SessionFormation s " +
           "JOIN s.creneaux c WHERE c.id = :creneauId AND s.groupe.id = :groupeId")
    boolean existsByCreneauIdAndGroupeId(@Param("creneauId") int creneauId, @Param("groupeId") int groupeId);
    
    // Nouvelles méthodes pour détecter les chevauchements par horaire
    @Query("SELECT DISTINCT s FROM SessionFormation s JOIN s.creneaux c WHERE s.formateur.id = :formateurId " +
           "AND c.date = :date " +
           "AND c.heureDebut < :heureFin " +
           "AND c.heureFin > :heureDebut")
    List<SessionFormation> findFormateurConflicts(
        @Param("formateurId") int formateurId,
        @Param("date") LocalDate date,
        @Param("heureDebut") LocalTime heureDebut,
        @Param("heureFin") LocalTime heureFin
    );
    
    @Query("SELECT DISTINCT s FROM SessionFormation s JOIN s.creneaux c WHERE s.salle.id = :salleId " +
           "AND c.date = :date " +
           "AND c.heureDebut < :heureFin " +
           "AND c.heureFin > :heureDebut")
    List<SessionFormation> findSalleConflicts(
        @Param("salleId") int salleId,
        @Param("date") LocalDate date,
        @Param("heureDebut") LocalTime heureDebut,
        @Param("heureFin") LocalTime heureFin
    );
    
    @Query("SELECT DISTINCT s FROM SessionFormation s JOIN s.creneaux c WHERE s.groupe.id = :groupeId " +
           "AND c.date = :date " +
           "AND c.heureDebut < :heureFin " +
           "AND c.heureFin > :heureDebut")
    List<SessionFormation> findGroupeConflicts(
        @Param("groupeId") int groupeId,
        @Param("date") LocalDate date,
        @Param("heureDebut") LocalTime heureDebut,
        @Param("heureFin") LocalTime heureFin
    );
    
    // Méthodes de recherche pour lister les sessions
    @Query("SELECT DISTINCT s FROM SessionFormation s WHERE s.formateur.id = :formateurId")
    List<SessionFormation> findByFormateurId(@Param("formateurId") int formateurId);
    
    @Query("SELECT DISTINCT s FROM SessionFormation s WHERE s.salle.id = :salleId")
    List<SessionFormation> findBySalleId(@Param("salleId") int salleId);
    
    @Query("SELECT DISTINCT s FROM SessionFormation s WHERE s.groupe.id = :groupeId")
    List<SessionFormation> findByGroupeId(@Param("groupeId") int groupeId);
    
    @Query("SELECT DISTINCT s FROM SessionFormation s JOIN s.creneaux c WHERE c.id = :creneauId")
    List<SessionFormation> findByCreneauId(@Param("creneauId") int creneauId);
    
    // Compte le nombre de sessions utilisant un matériel spécifique dans un créneau
    @Query("SELECT COUNT(s) FROM SessionFormation s " +
           "JOIN s.creneaux c " +
           "JOIN s.materielRequis m " +
           "WHERE c.id = :creneauId AND m.id = :materielId")
    long countSessionsUsingMaterielInCreneau(@Param("creneauId") int creneauId, @Param("materielId") int materielId);
    
    // Méthodes pour le système Formateur
    @Query("SELECT s FROM SessionFormation s WHERE s.formateur.id = :formateurId AND s.dateDebut > :date")
    List<SessionFormation> findByFormateurIdAndDateDebutAfter(@Param("formateurId") int formateurId, @Param("date") LocalDate date);
    
    // Méthodes pour le système Étudiant
    @Query("SELECT DISTINCT s FROM SessionFormation s WHERE s.groupe.id IN :groupeIds")
    List<SessionFormation> findByGroupeIdIn(@Param("groupeIds") List<Integer> groupeIds);
    
    @Query("SELECT s FROM SessionFormation s WHERE s.groupe.id = :groupeId AND s.dateDebut BETWEEN :dateDebut AND :dateFin")
    List<SessionFormation> findByGroupeIdAndDateDebutBetween(
        @Param("groupeId") int groupeId,
        @Param("dateDebut") LocalDate dateDebut,
        @Param("dateFin") LocalDate dateFin
    );
    
    @Query("SELECT s FROM SessionFormation s WHERE s.dateDebut BETWEEN :dateDebut AND :dateFin")
    List<SessionFormation> findByDateDebutBetween(@Param("dateDebut") LocalDate dateDebut, @Param("dateFin") LocalDate dateFin);
}