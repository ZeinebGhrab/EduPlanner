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

import com.springboot.springboot.entity.ressources.Materiel;
import com.springboot.springboot.service.ressources.MaterielService;

@RestController
@RequestMapping("/api/materiels")
@CrossOrigin(origins = "*")
public class MaterielController {

    @Autowired
    private MaterielService service;

    @GetMapping
    public ResponseEntity<List<Materiel>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Materiel> getById(@PathVariable int id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Materiel> create(@RequestBody Materiel materiel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(materiel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Materiel> update(@PathVariable int id, @RequestBody Materiel materiel) {
        return service.findById(id)
                .map(existing -> {
                    materiel.setId(id);
                    return ResponseEntity.ok(service.save(materiel));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(m -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
