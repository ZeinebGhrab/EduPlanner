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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.springboot.dto.conflit.ConflitDTO;
import com.springboot.springboot.dto.session.SessionFormationDTO;
import com.springboot.springboot.dto.session.SessionFormationRequestDTO;
import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.Planning;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.entity.ressources.Materiel;
import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.common.GroupeRepository;
import com.springboot.springboot.repository.personne.FormateurRepository;
import com.springboot.springboot.repository.planning.CreneauRepository;
import com.springboot.springboot.repository.planning.PlanningRepository;
import com.springboot.springboot.repository.planning.SessionRepository;
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
    private final SessionRepository sessionRepository;
    private final SalleRepository salleRepository;
    private final GroupeRepository groupeRepository;
    private final CreneauRepository creneauRepository;
    private final MaterielRepository materielRepository;
    private final PlanningRepository planningRepository;
    
    @Autowired
    public SessionFormationController(SessionFormationService service,
                                      FormateurRepository formateurRepository,
                                      SalleRepository salleRepository,
                                      GroupeRepository groupeRepository,
                                      CreneauRepository creneauRepository,
                                      MaterielRepository materielRepository,
                                      PlanningRepository planningRepository,
                                      SessionRepository sessionRepository,
                                      ConflitService conflitService) {
        this.service = service;
        this.formateurRepository = formateurRepository;
        this.salleRepository = salleRepository;
        this.groupeRepository = groupeRepository;
        this.creneauRepository = creneauRepository;
        this.materielRepository = materielRepository;
        this.planningRepository = planningRepository;
        this.sessionRepository = sessionRepository;
    }

    /**
     * GET /api/sessions - Retourne UNIQUEMENT les sessions VALIDES
     */
    @GetMapping
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = service.findAll();
        
        // ✅ Filtrer les sessions en conflit sauf si explicitement demandé
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }
        
        List<SessionFormationDTO> dtos = sessions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/sessions/{id} - Retourne une session (même si en conflit)
     */
    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<SessionFormationDTO> getById(@PathVariable int id) {
        try {
            SessionFormation session = service.findById(id);
            return ResponseEntity.ok(toDTO(session));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/sessions - Crée une session avec détection de conflits
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createSession(@RequestBody SessionFormationRequestDTO dto) {
        SessionFormation session = dtoToEntity(dto);

        // ✅ Sauvegarder avec gestion des conflits
        List<ConflitDTO> conflits = service.saveAvecConflit(session);

        // ✅ La session est TOUJOURS créée maintenant
        if (!conflits.isEmpty()) {
            // ✅ Retourner HTTP 409 AVEC l'ID de la session et les conflits
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "sessionId", session.getId(),
                    "statut", session.getStatut(),
                    "aDesConflits", session.getADesConflits(),
                    "message", "Session créée avec " + conflits.size() + " conflit(s) détecté(s)",
                    "conflits", conflits
            ));
        }

        // ✅ Pas de conflit, session VALIDE
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "sessionId", session.getId(),
                "statut", session.getStatut(),
                "aDesConflits", false,
                "message", "Session créée avec succès",
                "session", toDTO(session)
        ));
    }

    /**
     * PUT /api/sessions/{id} - Modifie une session avec détection de conflits
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody SessionFormationRequestDTO dto) {
        try {
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
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/sessions/{id} - Supprime une session
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        try {
            service.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ----- Endpoints de recherche -----
    
    /**
     * GET /api/sessions/formateur/{formateurId}
     * Paramètre optionnel : ?includeConflits=true
     */
    @GetMapping("/formateur/{formateurId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByFormateur(
            @PathVariable int formateurId,
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = service.findByFormateurId(formateurId);
        
        // Filtrer les sessions en conflit sauf si explicitement demandé
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }
        
        List<SessionFormationDTO> dtos = sessions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * GET /api/sessions/formateur/{formateurId}/filter
     */
    @GetMapping("/formateur/{formateurId}/filter")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByFormateurWithFilters(
            @PathVariable int formateurId,
            @RequestParam(required = false) Integer groupeId,
            @RequestParam(required = false) Integer salleId,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin,
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = service.findByFormateurId(formateurId);

        // ✅ Filtrer les sessions en conflit sauf si explicitement demandé
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }

        // Filtrer côté serveur
        if (groupeId != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getGroupe() != null && s.getGroupe().getId() == groupeId)
                    .collect(Collectors.toList());
        }

        if (salleId != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getSalle() != null && s.getSalle().getId() == salleId)
                    .collect(Collectors.toList());
        }

        if (statut != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getCreneaux().get(0).getStatut() != null && 
                                s.getCreneaux().get(0).getStatut().equalsIgnoreCase(statut))
                    .collect(Collectors.toList());
        }

        if (dateDebut != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getPlanning() != null && 
                                 s.getPlanning().getSemaine().isAfter(java.time.LocalDate.parse(dateDebut).minusDays(1)))
                    .collect(Collectors.toList());
        }

        if (dateFin != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getPlanning() != null &&
                                 s.getPlanning().getSemaine().isBefore(java.time.LocalDate.parse(dateFin).plusDays(1)))
                    .collect(Collectors.toList());
        }

        List<SessionFormationDTO> dtos = sessions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/sessions/salle/{salleId}
     * Paramètre optionnel : ?includeConflits=true
     */
    @GetMapping("/salle/{salleId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getBySalle(
            @PathVariable int salleId,
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = service.findBySalleId(salleId);
        
        // ✅ Filtrer les sessions en conflit sauf si explicitement demandé
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }
        
        List<SessionFormationDTO> dtos = sessions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * GET /api/sessions/groupe/{groupeId}
     * Paramètre optionnel : ?includeConflits=true
     */
    @GetMapping("/groupe/{groupeId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByGroupe(
            @PathVariable int groupeId,
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = service.findByGroupeId(groupeId);
        
        // ✅ Filtrer les sessions en conflit sauf si explicitement demandé
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }
        
        List<SessionFormationDTO> dtos = sessions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * GET /api/sessions/creneau/{creneauId}
     * Paramètre optionnel : ?includeConflits=true
     */
    @GetMapping("/creneau/{creneauId}")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByCreneau(
            @PathVariable int creneauId,
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = service.findByCreneauId(creneauId);
        
        // Filtrer les sessions en conflit 
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }
        
        List<SessionFormationDTO> dtos = sessions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * GET /api/sessions/formateur/{formateurId}/upcoming - Sessions à venir
     */
    @GetMapping("/formateur/{formateurId}/upcoming")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getUpcomingSessions(
            @PathVariable Long formateurId,
            @RequestParam(defaultValue = "3") int limit,
            @RequestParam(required = false, defaultValue = "false") boolean includeConflits) {
        
        List<SessionFormation> sessions = sessionRepository
                .findUpcomingSessionsByFormateurId(formateurId, java.time.LocalDate.now())
                .stream()
                .sorted((s1, s2) -> s1.getPlanning().getSemaine()
                        .compareTo(s2.getPlanning().getSemaine()))
                .limit(limit)
                .collect(Collectors.toList());
        
        // Filtrer les sessions en conflit 
        if (!includeConflits) {
            sessions = sessions.stream()
                .filter(s -> !"EN_CONFLIT".equals(s.getStatut()) && 
                            !Boolean.TRUE.equals(s.getADesConflits()))
                .collect(Collectors.toList());
        }
        
        List<SessionFormationDTO> dtos = sessions.stream()
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

        List<Creneau> creneaux = creneauRepository.findAllById(dto.creneauIds);
        if (creneaux.isEmpty()) {
            throw new RuntimeException("Aucun créneau trouvé pour les IDs fournis: " + dto.creneauIds);
        }

        Planning planning;
        if (dto.planningId > 0) {
            planning = planningRepository.findById(dto.planningId)
                    .orElseThrow(() -> new RuntimeException("Planning introuvable"));
        } else {
            planning = new Planning();
            planning.setSemaine(java.time.LocalDate.now());
            planning.setStatut("EN_COURS");
            planning = planningRepository.save(planning);
        }

        List<Materiel> materiel = dto.materielRequisIds != null ? 
                materielRepository.findAllById(dto.materielRequisIds) : List.of();

        SessionFormation session = new SessionFormation();
        session.setNomCours(dto.nomCours);
        session.setDescription(dto.description);
        session.setDuree(dto.duree);
        session.setStatut(dto.statut);
        session.setFormateur(formateur);
        session.setSalle(salle);
        session.setGroupe(groupe);
        session.setCreneaux(creneaux);
        session.setPlanning(planning);
        session.setMaterielRequis(materiel);
        session.setDateDebut(dto.dateDebut);
        session.setDateFin(dto.dateFin);

        return session;
    }

    private SessionFormationDTO toDTO(SessionFormation session) {
        SessionFormationDTO dto = new SessionFormationDTO();
        dto.setId(session.getId());
        dto.nomCours = session.getNomCours();
        dto.duree = session.getDuree();
        dto.statut = session.getStatut();

        if (session.getFormateur() != null) {
            dto.formateurId = session.getFormateur().getId();
            dto.formateurNom = session.getFormateur().getNom() + " " + session.getFormateur().getPrenom();
        }

        if (session.getSalle() != null) {
            dto.salleId = session.getSalle().getId();
            dto.salleNom = session.getSalle().getNom();
        }

        if (session.getGroupe() != null) {
            dto.groupeId = session.getGroupe().getId();
            dto.groupeNom = session.getGroupe().getNom();
            dto.etudiants = session.getGroupe().getEtudiants().stream()
                    .map(e -> e.getNom() + " " + e.getPrenom())
                    .collect(Collectors.toList());
        }

        if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
            dto.creneauId = session.getCreneaux().get(0).getId();
            dto.statut = session.getCreneaux().get(0).getStatut();
            dto.date = session.getCreneaux().get(0).getDate();
            dto.creneauxHoraires = session.getCreneaux().stream()
                    .map(c -> c.getHeureDebut() + " - " + c.getHeureFin())
                    .collect(Collectors.toList());
        }

        if (session.getPlanning() != null) {
            dto.planningId = session.getPlanning().getId();
            dto.planningSemaine = session.getPlanning().getSemaine().toString();
        }

        if (session.getMaterielRequis() != null) {
            dto.materielRequisIds = session.getMaterielRequis().stream()
                    .map(Materiel::getId)
                    .collect(Collectors.toList());
            dto.materielRequisNoms = session.getMaterielRequis().stream()
                    .map(Materiel::getNom)
                    .collect(Collectors.toList());
        }

        return dto;
    }
}