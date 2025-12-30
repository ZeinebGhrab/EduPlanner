package com.springboot.springboot.conflit;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.springboot.dto.conflit.ConflitDTO;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.service.planning.ConflitService;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/conflits")
@CrossOrigin(origins = "*")
public class ConflitController {

    @Autowired
    private ConflitService conflitService;

    /**
     * Récupère tous les conflits
     */
    @GetMapping
    @Transactional// ✅ AJOUT pour charger les relations lazy
    public ResponseEntity<List<ConflitDTO>> getAllConflits() {
        List<Conflit> conflits = conflitService.findAll();
        
        // ✅ Forcer le chargement des sessions et du planning
        conflits.forEach(conflit -> {
            if (conflit.getSessionsImpliquees() != null) {
                conflit.getSessionsImpliquees().forEach(session -> {
                    if (session.getPlanning() != null) {
                        session.getPlanning().getId(); // Force le chargement
                    }
                });
            }
        });
        
        List<ConflitDTO> conflitsDTO = conflits.stream()
                .map(ConflitDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(conflitsDTO);
    }

    /**
     * Récupère un conflit par ID
     */
    @GetMapping("/{id}")
    @Transactional // ✅ AJOUT
    public ResponseEntity<ConflitDTO> getConflitById(@PathVariable int id) {
        return conflitService.findById(id)
                .map(conflit -> {
                    // ✅ Forcer le chargement des sessions et du planning
                    if (conflit.getSessionsImpliquees() != null) {
                        conflit.getSessionsImpliquees().forEach(session -> {
                            if (session.getPlanning() != null) {
                                session.getPlanning().getId();
                            }
                        });
                    }
                    return ConflitDTO.fromEntity(conflit);
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    /**
     * Crée un nouveau conflit manuellement (si nécessaire)
     */
    @PostMapping
    public ResponseEntity<ConflitDTO> createConflit(@RequestBody Conflit conflit) {
        Conflit savedConflit = conflitService.save(conflit);
        return ResponseEntity.ok(ConflitDTO.fromEntity(savedConflit));
    }
    
    
    /**
     * Supprime un conflit par ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConflit(@PathVariable int id) {
        return conflitService.findById(id)
                .map(conflit -> {
                    conflitService.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Supprime tous les conflits (utile pour réinitialisation)
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAllConflits() {
        List<Conflit> conflits = conflitService.findAll();
        conflits.forEach(conflit -> conflitService.deleteById(conflit.getId()));
        return ResponseEntity.noContent().build();
    }
}