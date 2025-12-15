package com.springboot.springboot.controller.planning;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

import com.springboot.springboot.dto.conflit.ConflitDTO;
import com.springboot.springboot.dto.session.SessionFormationDTO;
import com.springboot.springboot.dto.session.SessionFormationRequestDTO;
import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.entity.ressources.Materiel;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.common.GroupeRepository;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.planning.CreneauRepository;
import com.springboot.springboot.repository.planning.PlanningRepository;
import com.springboot.springboot.repository.ressources.MaterielRepository;
import com.springboot.springboot.repository.ressources.SalleRepository;
import com.springboot.springboot.service.planning.ConflitService;
import com.springboot.springboot.service.planning.SessionFormationService;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionFormationController {

    private final SessionFormationService service;
    private final FormateurRepository formateurRepository;
    private final SalleRepository salleRepository;
    private final GroupeRepository groupeRepository;
    private final CreneauRepository creneauRepository;
    private final MaterielRepository materielRepository;
    private final PlanningRepository planningRepository;
    private final ConflitService conflitService;

    @Autowired
    public SessionFormationController(SessionFormationService service,
                                      FormateurRepository formateurRepository,
                                      SalleRepository salleRepository,
                                      GroupeRepository groupeRepository,
                                      CreneauRepository creneauRepository,
                                      MaterielRepository materielRepository,
                                      PlanningRepository planningRepository,
                                      ConflitService conflitService) {
        this.service = service;
        this.formateurRepository = formateurRepository;
        this.salleRepository = salleRepository;
        this.groupeRepository = groupeRepository;
        this.creneauRepository = creneauRepository;
        this.materielRepository = materielRepository;
        this.planningRepository = planningRepository;
        this.conflitService = conflitService;
    }

    @GetMapping
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getAll() {
        List<SessionFormationDTO> dtos = service.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<SessionFormationDTO> getById(@PathVariable int id) {
        return service.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody SessionFormationRequestDTO dto) {
        SessionFormation session = dtoToEntity(dto);

        List<ConflitDTO> conflits = service.saveAvecConflit(session);

        // S'il y a des conflits, retourner HTTP 409
        if (!conflits.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "message", "Conflits détectés lors de la création de la session",
                    "conflits", conflits
            ));
        }

        // Pas de conflit, retourner la session créée
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(session));
    }


    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody SessionFormationRequestDTO dto) {
        return service.findById(id)
                .map(existing -> {
                    SessionFormation updated = dtoToEntity(dto);
                    updated.setId(id);

                    List<ConflitDTO> conflits = service.saveAvecConflit(updated);

                    if (!conflits.isEmpty()) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                                "message", "Conflits détectés lors de la mise à jour de la session",
                                "conflits", conflits
                        ));
                    } else {
                        return ResponseEntity.ok(toDTO(updated));
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return service.findById(id)
                .map(s -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    // ----- Endpoints de recherche -----
    
    @GetMapping("/formateur/{formateurId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByFormateur(@PathVariable int formateurId) {
        List<SessionFormationDTO> dtos = service.findByFormateurId(formateurId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/salle/{salleId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getBySalle(@PathVariable int salleId) {
        List<SessionFormationDTO> dtos = service.findBySalleId(salleId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/groupe/{groupeId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByGroupe(@PathVariable int groupeId) {
        List<SessionFormationDTO> dtos = service.findByGroupeId(groupeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/creneau/{creneauId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByCreneau(@PathVariable int creneauId) {
        List<SessionFormationDTO> dtos = service.findByCreneauId(creneauId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ----- Méthodes utilitaires -----
    private SessionFormation dtoToEntity(SessionFormationRequestDTO dto) {
        Formateur formateur = formateurRepository.findById(dto.formateurId)
                .orElseThrow(() -> new RuntimeException("Formateur introuvable"));

        Salle salle = salleRepository.findById(dto.salleId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));

        Groupe groupe = groupeRepository.findById(dto.groupeId)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));

        // Gérer la liste de créneaux
        List<Creneau> creneaux = creneauRepository.findAllById(dto.creneauIds);
        if (creneaux.isEmpty()) {
            throw new RuntimeException("Aucun créneau trouvé pour les IDs fournis: " + dto.creneauIds);
        }

        // Planning optionnel : créer un planning par défaut si non fourni
        Planning planning;
        if (dto.planningId > 0) {
            planning = planningRepository.findById(dto.planningId)
                    .orElseThrow(() -> new RuntimeException("Planning introuvable"));
        } else {
            // Créer un planning par défaut pour la semaine courante
            planning = new Planning();
            planning.setSemaine(java.time.LocalDate.now());
            planning.setStatut("EN_COURS");
            planning = planningRepository.save(planning);
        }

        List<Materiel> materiel = dto.materielRequisIds != null ? 
                materielRepository.findAllById(dto.materielRequisIds) : List.of();

        SessionFormation session = new SessionFormation();
        session.setNomCours(dto.nomCours);
        session.setDuree(dto.duree);
        session.setStatut(dto.statut);
        session.setFormateur(formateur);
        session.setSalle(salle);
        session.setGroupe(groupe);
        session.setCreneaux(creneaux);
        session.setPlanning(planning);
        session.setMaterielRequis(materiel);

        return session;
    }

    private SessionFormationDTO toDTO(SessionFormation session) {
        SessionFormationDTO dto = new SessionFormationDTO();
        dto.nomCours = session.getNomCours();
        dto.duree = session.getDuree();
        dto.statut = session.getStatut();
        dto.formateurId = session.getFormateur() != null ? session.getFormateur().getId() : 0;
        dto.salleId = session.getSalle() != null ? session.getSalle().getId() : 0;
        dto.groupeId = session.getGroupe() != null ? session.getGroupe().getId() : 0;
        dto.creneauId = (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) ? session.getCreneaux().get(0).getId() : 0;
        dto.planningId = session.getPlanning() != null ? session.getPlanning().getId() : 0;
        dto.materielRequisIds = session.getMaterielRequis().stream()
                .map(Materiel::getId)
                .collect(Collectors.toList());
        return dto;
    }
}
