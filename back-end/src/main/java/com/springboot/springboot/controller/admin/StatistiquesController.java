package com.springboot.springboot.controller.admin;

import com.springboot.springboot.dto.admin.DashboardDTO;
import com.springboot.springboot.dto.admin.StatistiquesDTO;
import com.springboot.springboot.service.admin.StatistiquesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistiques")
@CrossOrigin(origins = "*")
public class StatistiquesController {
    
    @Autowired
    private StatistiquesService statistiquesService;
    
    /**
     * Dashboard complet avec toutes les statistiques
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard() {
        return ResponseEntity.ok(statistiquesService.getDashboard());
    }
    
    /**
     * Générer toutes les statistiques
     */
    @PostMapping("/generer")
    public ResponseEntity<String> genererStatistiques() {
        statistiquesService.genererToutesStatistiques();
        return ResponseEntity.ok("Statistiques générées avec succès");
    }
    
    /**
     * Nombre d'étudiants par groupe
     */
    @GetMapping("/etudiants-par-groupe")
    public ResponseEntity<Map<Integer, Integer>> getEtudiantsParGroupe() {
        return ResponseEntity.ok(statistiquesService.getEtudiantsParGroupe());
    }
    
    /**
     * Nombre de jours par session
     */
    @GetMapping("/jours-par-session")
    public ResponseEntity<Map<Integer, Integer>> getJoursParSession() {
        return ResponseEntity.ok(statistiquesService.getJoursParSession());
    }
    
    /**
     * Toutes les statistiques historiques
     */
    @GetMapping
    public ResponseEntity<List<StatistiquesDTO>> getAll() {
        return ResponseEntity.ok(statistiquesService.findAll());
    }
    
    /**
     * Statistiques par type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<StatistiquesDTO>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(statistiquesService.findByType(type));
    }
    
    /**
     * Dernière statistique d'un type
     */
    @GetMapping("/latest/{type}")
    public ResponseEntity<StatistiquesDTO> getLatestByType(@PathVariable String type) {
        return statistiquesService.getLatestByType(type)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Supprimer une statistique
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        statistiquesService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
