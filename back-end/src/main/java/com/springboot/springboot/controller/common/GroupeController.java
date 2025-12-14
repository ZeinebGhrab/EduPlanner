package com.springboot.springboot.controller.common;

import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.service.common.GroupeService;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/groupes")
public class GroupeController {

    @Autowired
    private GroupeService groupeService;

    // -------------------- CRUD --------------------

    @GetMapping
    public List<Groupe> getAllGroupes() {
        return groupeService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Groupe> getGroupeById(@PathVariable int id) {
        return groupeService.findById(id);
    }

    @PostMapping
    public Groupe createGroupe(@RequestBody Groupe groupe) {
        // L'effectif est toujours 0 à la création (aucun étudiant)
        groupe.setEffectif(0);
        return groupeService.save(groupe);
    }

    @PutMapping("/{id}")
    public Groupe updateGroupe(@PathVariable int id, @RequestBody Groupe groupe) {

        Groupe existing = groupeService.findById(id)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));

        existing.setNom(groupe.getNom());
        existing.setCode(groupe.getCode());
        
        // Valider que le nouveau effectifMax >= effectif actuel
        if (groupe.getEffectifMax() < existing.getEffectif()) {
            throw new RuntimeException("L'effectif maximum ne peut pas être inférieur à l'effectif actuel (" + existing.getEffectif() + ")");
        }
        
        existing.setEffectifMax(groupe.getEffectifMax());
        // L'effectif reste inchangé (calculé selon les étudiants)

        return groupeService.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteGroupe(@PathVariable int id) {
        groupeService.deleteById(id);
    }

    // -------------------- MÉTHODES MÉTIER --------------------

    // Ajouter un étudiant dans un groupe
    @PostMapping("/{idGroupe}/ajouter-etudiant/{idEtudiant}")
    @Transactional
    public Groupe ajouterEtudiant(
            @PathVariable int idGroupe,
            @PathVariable int idEtudiant) {
        return groupeService.ajouterEtudiant(idGroupe, idEtudiant);
    }

    // Retirer un étudiant d'un groupe
    @Transactional
    @PostMapping("/{idGroupe}/retirer-etudiant/{idEtudiant}")
    public Groupe retirerEtudiant(
            @PathVariable int idGroupe,
            @PathVariable int idEtudiant) {
        return groupeService.retirerEtudiant(idGroupe, idEtudiant);
    }

    // Vérifier si un créneau est libre
    @PostMapping("/{idGroupe}/creneau-libre")
    @Transactional
    public boolean estCreneauLibre(
            @PathVariable int idGroupe,
            @RequestBody Creneau creneau) {
        return groupeService.estCreneauLibre(idGroupe, creneau);
    }
}

