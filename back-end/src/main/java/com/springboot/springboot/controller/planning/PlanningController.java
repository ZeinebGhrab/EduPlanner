package com.springboot.springboot.controller.planning;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.springboot.dto.conflit.ConflitDTO;
import com.springboot.springboot.dto.conflit.ConflitDetectionDTO;
import com.springboot.springboot.dto.planning.PlanningDTO;
import com.springboot.springboot.dto.session.SessionCreateDTO;
import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.planning.ConflitRepository;
import com.springboot.springboot.service.common.GroupeService;
import com.springboot.springboot.service.personne.FormateurService;
import com.springboot.springboot.service.planning.CreneauService;
import com.springboot.springboot.service.planning.PlanningService;
import com.springboot.springboot.service.ressources.SalleService;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/plannings")
@CrossOrigin(origins = "*")
public class PlanningController {

    @Autowired
    private PlanningService service;

    @Autowired
    private FormateurService formateurService;

    @Autowired
    private GroupeService groupeService;

    @Autowired
    private SalleService salleService;

    @Autowired
    private CreneauService creneauService;
    
    @Autowired
    private ConflitRepository conflitRepository;
    
    /**
     * GET tous les plannings avec conflits récupérés via créneaux
     */
    @GetMapping
    @Transactional
    public ResponseEntity<List<PlanningDTO>> getAll() {
        List<PlanningDTO> dtos = service.findAll().stream()
                .map(planning -> {
                    // ✅ CORRECTION : Récupérer les conflits via créneaux des sessions
                    List<ConflitDTO> conflitsDTO = getConflitsFromPlanning(planning);

                    PlanningDTO dto = new PlanningDTO();
                    dto.id = planning.getId();
                    dto.statut = planning.getStatut();
                    dto.conflits = conflitsDTO;
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(dtos);
    }
    
    /**
     * GET planning par ID avec conflits
     */
    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<PlanningDTO> getById(@PathVariable int id) {
        return service.findById(id)
                .map(planning -> {
                    // ✅ CORRECTION : Récupérer les conflits via créneaux
                    List<ConflitDTO> conflitsDTO = getConflitsFromPlanning(planning);

                    PlanningDTO dto = new PlanningDTO();
                    dto.id = planning.getId();
                    dto.statut = planning.getStatut();
                    dto.conflits = conflitsDTO;

                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * ✅ NOUVELLE MÉTHODE : Récupère les conflits d'un planning via ses créneaux
     * Structure : Planning → Sessions → Créneaux → Conflits
     */
    private List<ConflitDTO> getConflitsFromPlanning(Planning planning) {
        // 1. Récupérer toutes les sessions du planning
        List<SessionFormation> sessions = planning.getSessions();
        
        // 2. Récupérer tous les créneaux de ces sessions
        List<Integer> creneauIds = sessions.stream()
            .flatMap(session -> session.getCreneaux().stream())
            .map(Creneau::getId)
            .distinct()
            .collect(Collectors.toList());
        
        // 3. Récupérer tous les conflits associés à ces créneaux
        if (creneauIds.isEmpty()) {
            return List.of();
        }
        
        List<Conflit> conflits = conflitRepository.findAll().stream()
            .filter(conflit -> conflit.getCreneau() != null && 
                              creneauIds.contains(conflit.getCreneau().getId()))
            .collect(Collectors.toList());
        
        // 4. Convertir en DTO
        return conflits.stream()
            .map(ConflitDTO::fromEntity)
            .collect(Collectors.toList());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Planning> update(@PathVariable int id, @RequestBody Planning updatedPlanning) {
        return service.findById(id)
                .map(existing -> {
                    existing.setStatut(updatedPlanning.getStatut());
                    Planning saved = service.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(existing -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Planning> createPlanning(@RequestBody Planning planning) {
        Planning saved = service.save(planning);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Ajouter session avec conflits */
    @PostMapping("/{id}/sessions")
    public ResponseEntity<?> ajouterSession(
            @PathVariable int id,
            @RequestBody SessionCreateDTO dto
    ) {
        Optional<Planning> planningOpt = service.findById(id);
        if (planningOpt.isEmpty()) return ResponseEntity.notFound().build();

        Planning planning = planningOpt.get();

        Optional<Formateur> formateurOpt = formateurService.findById(dto.formateurId);
        Optional<Groupe> groupeOpt = groupeService.findById(dto.groupeId);
        Optional<Salle> salleOpt = salleService.findById(dto.salleId);
        Optional<Creneau> creneauOpt = creneauService.findById(dto.creneauId);

        if (formateurOpt.isEmpty()) return ResponseEntity.status(404).body("Formateur not found");
        if (groupeOpt.isEmpty()) return ResponseEntity.status(404).body("Groupe not found");
        if (salleOpt.isEmpty()) return ResponseEntity.status(404).body("Salle not found");
        if (creneauOpt.isEmpty()) return ResponseEntity.status(404).body("Creneau not found");

        SessionFormation session = new SessionFormation();
        session.setNomCours(dto.nomCours);
        session.setDuree(dto.duree);
        session.setStatut(dto.statut);
        session.setFormateur(formateurOpt.get());
        session.setGroupe(groupeOpt.get());
        session.setSalle(salleOpt.get());
        session.setCreneaux(List.of(creneauOpt.get()));

        boolean success = service.ajouterSessionAvecConflits(id, session, List.of());

        if (!success) return ResponseEntity.status(400).body("Erreur lors de l'ajout de la session");

        // ✅ Retourner les conflits via la nouvelle méthode
        List<ConflitDTO> conflitsDTO = getConflitsFromPlanning(planning);

        return ResponseEntity.ok(conflitsDTO);
    }

    /** Supprimer session */
    @DeleteMapping("/{id}/sessions")
    public ResponseEntity<Void> supprimerSession(
            @PathVariable int id,
            @RequestBody SessionFormation session
    ) {
        service.supprimerSession(id, session);
        return ResponseEntity.noContent().build();
    }

    /** Détecter conflits */
    @PostMapping("/{id}/conflits/detecter")
    @Transactional
    public ResponseEntity<List<ConflitDTO>> detecterConflits(
            @PathVariable int id,
            @RequestBody ConflitDetectionDTO dto
    ) {
        List<Conflit> conflits = service.detecterTousConflits(id, dto.contraintes);

        List<ConflitDTO> conflitsDTO = conflits.stream()
                .map(ConflitDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(conflitsDTO);
    }
}