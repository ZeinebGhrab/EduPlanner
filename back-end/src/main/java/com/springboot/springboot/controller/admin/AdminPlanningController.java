package com.springboot.springboot.controller.admin;

import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.service.planning.PlanningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/planning")
@CrossOrigin(origins = "*")
public class AdminPlanningController {
    
    @Autowired
    private PlanningService planningService;
    
    /**
     * Valider un planning
     */
    @PutMapping("/{id}/valider")
    public ResponseEntity<?> validerPlanning(@PathVariable int id, Authentication authentication) {
        try {
            String username = authentication.getName();
            Planning planning = planningService.validerPlanning(id, username);
            return ResponseEntity.ok(planning);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    /**
     * Publier un planning
     */
    @PutMapping("/{id}/publier")
    public ResponseEntity<?> publierPlanning(@PathVariable int id) {
        try {
            Planning planning = planningService.publierPlanning(id);
            return ResponseEntity.ok(planning);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    /**
     * Génération automatique du planning (placeholder)
     * Cette méthode peut être étendue avec un algorithme de génération automatique
     */
    @PostMapping("/generer-auto")
    public ResponseEntity<String> genererPlanningAutomatique() {
        // TODO: Implémenter l'algorithme de génération automatique
        // 1. Récupérer toutes les sessions sans planning
        // 2. Récupérer tous les créneaux disponibles
        // 3. Appliquer un algorithme de placement (greedy, backtracking, etc.)
        // 4. Vérifier les contraintes
        // 5. Créer le planning si valide
        
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body("Fonctionnalité de génération automatique en développement");
    }
}
