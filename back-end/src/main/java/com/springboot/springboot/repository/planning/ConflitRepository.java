package com.springboot.springboot.repository.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.planning.Conflit;

import java.util.List;

@Repository
public interface ConflitRepository extends JpaRepository<Conflit, Integer> {
    
    /**
     * Récupère tous les conflits d'un planning via ses créneaux
     * Planning → Sessions → Créneaux → Conflits
     */
    @Query("""
        SELECT DISTINCT c FROM Conflit c
        JOIN c.creneau cr
        JOIN SessionFormation s ON cr MEMBER OF s.creneaux
        WHERE s.planning.id = :planningId
    """)
    List<Conflit> findByPlanningId(@Param("planningId") int planningId);
    List<Conflit> findByCreneauId(int creneauId);
}