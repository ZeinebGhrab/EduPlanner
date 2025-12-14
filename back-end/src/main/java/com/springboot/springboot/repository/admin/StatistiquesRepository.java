package com.springboot.springboot.repository.admin;

import com.springboot.springboot.entity.admin.Statistiques;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StatistiquesRepository extends JpaRepository<Statistiques, Integer> {
    
    List<Statistiques> findByTypeStat(String typeStat);
    
    @Query("SELECT s FROM Statistiques s ORDER BY s.dateCalcul DESC")
    List<Statistiques> findAllOrderByDateDesc();
    
    Optional<Statistiques> findFirstByTypeStatOrderByDateCalculDesc(String typeStat);
}
