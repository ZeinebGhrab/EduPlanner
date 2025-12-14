package com.springboot.springboot.controller.planning;

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

import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.service.planning.CreneauService;

@RestController
@RequestMapping("/api/creneaux")
@CrossOrigin(origins = "*")
public class CreneauController {

    @Autowired
    private CreneauService service;

    @GetMapping
    public ResponseEntity<List<Creneau>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Creneau> getById(@PathVariable int id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Creneau> create(@RequestBody Creneau creneau) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(creneau));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Creneau> update(@PathVariable int id, @RequestBody Creneau creneau) {
        return service.findById(id)
                .map(existing -> {
                    creneau.setId(id);
                    return ResponseEntity.ok(service.save(creneau));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(c -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}