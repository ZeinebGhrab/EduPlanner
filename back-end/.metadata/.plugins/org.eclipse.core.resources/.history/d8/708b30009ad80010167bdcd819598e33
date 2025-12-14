package com.springboot.springboot.controller.personne;

import com.springboot.springboot.dto.disponibilite.DisponibiliteFormateurDTO;
import com.springboot.springboot.entity.personne.DisponibiliteFormateur;
import com.springboot.springboot.service.personne.DisponibiliteFormateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disponibilites")
@CrossOrigin(origins = "*")
public class DisponibiliteFormateurController {

    @Autowired
    private DisponibiliteFormateurService service;

    @GetMapping
    public ResponseEntity<List<DisponibiliteFormateur>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisponibiliteFormateur> getById(@PathVariable int id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DisponibiliteFormateur> create(@RequestBody DisponibiliteFormateurDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.saveFromDTO(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DisponibiliteFormateur> update(@PathVariable int id, @RequestBody DisponibiliteFormateurDTO dto) {
        return service.findById(id)
                .map(existing -> {
                    dto.setId(id);
                    return ResponseEntity.ok(service.saveFromDTO(dto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(d -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/formateur/{formateurId}")
    public ResponseEntity<List<DisponibiliteFormateur>> getByFormateur(@PathVariable Integer formateurId) {
        return ResponseEntity.ok(service.findAll().stream()
                .filter(d -> d.getFormateur() != null && d.getFormateur().getId() == formateurId)
                .toList());
    }
}
