package com.springboot.springboot.controller.personne;

import com.springboot.springboot.entity.personne.Etudiant;
import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.service.personne.EtudiantService;
import com.springboot.springboot.repository.common.GroupeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/etudiants")
@CrossOrigin(origins = "*")
public class EtudiantController {

    @Autowired
    private EtudiantService service;

    @Autowired
    private GroupeRepository groupeRepository;

    @GetMapping
    public ResponseEntity<List<Etudiant>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Etudiant> getById(@PathVariable int id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Etudiant> create(@RequestBody Etudiant etudiant) {
        // Gérer les groupes si présents
        if (etudiant.getGroupes() != null && !etudiant.getGroupes().isEmpty()) {
            List<Groupe> groupes = etudiant.getGroupes().stream()
                    .map(g -> groupeRepository.findById(g.getId())
                            .orElseThrow(() -> new RuntimeException("Groupe introuvable avec ID: " + g.getId())))
                    .collect(Collectors.toList());
            etudiant.setGroupes(groupes);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(etudiant));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Etudiant> update(@PathVariable int id, @RequestBody Etudiant etudiant) {
        try {
            Etudiant updated = service.updateEtudiant(id, etudiant);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(e -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
