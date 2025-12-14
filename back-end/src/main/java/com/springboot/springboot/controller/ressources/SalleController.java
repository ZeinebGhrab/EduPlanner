package com.springboot.springboot.controller.ressources;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.springboot.dto.salle.SalleDTO;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.service.ressources.SalleService;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/salles")
@CrossOrigin(origins = "*")
public class SalleController {

    @Autowired
    private SalleService service;

    // ---------------- GET ALL ----------------
    @GetMapping
    @Transactional
    public ResponseEntity<List<SalleDTO>> getAll() {
        List<SalleDTO> dtos = service.findAll().stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // ---------------- GET BY ID ----------------
    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<SalleDTO> getById(@PathVariable int id) {
        return service.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---------------- CREATE ----------------
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Salle salle) {

        if (salle.getNom() == null || salle.getNom().isEmpty()) {
            return ResponseEntity.badRequest().body("Le nom de la salle est obligatoire.");
        }

        if (salle.getCapacite() <= 0) {
            return ResponseEntity.badRequest().body("La capacité de la salle doit être positive.");
        }

        Salle saved = service.save(salle);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ---------------- UPDATE ----------------
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody Salle salle) {

        return service.findById(id)
                .map(existing -> {

                    existing.setNom(salle.getNom());
                    existing.setCapacite(salle.getCapacite());
                    existing.setBatiment(salle.getBatiment());
                    existing.setType(salle.getType());

                    Salle updated = service.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ---------------- DELETE ----------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(salle -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Méthode utilitaire pour transformer l'entité en DTO
    private SalleDTO toDTO(Salle salle) {
        return new SalleDTO(
                salle.getId(),
                salle.getNom(),
                salle.getCapacite(),
                salle.getBatiment(),
                salle.getType(),
                List.of() // Liste vide car equipements supprimés
        );
    }
}