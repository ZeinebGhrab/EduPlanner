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
        try {
            SessionFormation session = service.findById(id);
            return ResponseEntity.ok(toDTO(session));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

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
                    "sessionId", session.getId(),  // ✅ ID de la session créée
                    "statut", session.getStatut(),  // ✅ "EN_CONFLIT"
                    "aDesConflits", session.getADesConflits(),  // ✅ true
                    "message", "Session créée avec " + conflits.size() + " conflit(s) détecté(s)",
                    "conflits", conflits
            ));
        }

        // ✅ Pas de conflit, session VALIDE
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "sessionId", session.getId(),
                "statut", session.getStatut(),  // ✅ "VALIDE"
                "aDesConflits", false,
                "message", "Session créée avec succès",
                "session", toDTO(session)
        ));
    }


    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody SessionFormationRequestDTO dto) {
        try {
            // Transformer le DTO en entity et mettre à jour l'ID
            SessionFormation updated = dtoToEntity(dto);
            updated.setId(id);

            // Sauvegarde avec gestion des conflits
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


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        try {
            // Supprimer la session
            service.deleteById(id);

            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            // La session n'existe pas
            return ResponseEntity.notFound().build();
        }
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
    
    @GetMapping("/formateur/{formateurId}/filter")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getByFormateurWithFilters(
            @PathVariable int formateurId,
            @RequestParam(required = false) Integer groupeId,
            @RequestParam(required = false) Integer salleId,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin
    ) {
        List<SessionFormation> sessions = service.findByFormateurId(formateurId);

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
                    .filter(s -> s.getCreneaux().get(0).getStatut() != null && s.getCreneaux().get(0).getStatut().equalsIgnoreCase(statut))
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
        dto.setId(session.getId());
        dto.nomCours = session.getNomCours();
        dto.duree = session.getDuree();
        dto.statut = session.getStatut();

        // Formateur
        if (session.getFormateur() != null) {
            dto.formateurId = session.getFormateur().getId();
            dto.formateurNom = session.getFormateur().getNom() + " " + session.getFormateur().getPrenom();
        }

        // Salle
        if (session.getSalle() != null) {
            dto.salleId = session.getSalle().getId();
            dto.salleNom = session.getSalle().getNom();
        }

        // Groupe
        if (session.getGroupe() != null) {
            dto.groupeId = session.getGroupe().getId();
            dto.groupeNom = session.getGroupe().getNom();

            // Étudiants du groupe
            dto.etudiants = session.getGroupe().getEtudiants().stream()
                    .map(e -> e.getNom() + " " + e.getPrenom())
                    .collect(Collectors.toList());
        }

        // Créneaux
        if (session.getCreneaux() != null && !session.getCreneaux().isEmpty()) {
            dto.creneauId = session.getCreneaux().get(0).getId();
            dto.statut = session.getCreneaux().get(0).getStatut();
            dto.date= session.getCreneaux().get(0).getDate();
            dto.creneauxHoraires = session.getCreneaux().stream()
                    .map(c -> c.getHeureDebut() + " - " + c.getHeureFin())
                    .collect(Collectors.toList());
        }

        // Planning
        if (session.getPlanning() != null) {
            dto.planningId = session.getPlanning().getId();
            dto.planningSemaine = session.getPlanning().getSemaine().toString();
        }

        // Matériel
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
    
    
 // Prochaines sessions pour un formateur 
    @GetMapping("/formateur/{formateurId}/upcoming")
    @Transactional
    public ResponseEntity<List<SessionFormationDTO>> getUpcomingSessions(
            @PathVariable Long formateurId,
            @RequestParam(defaultValue = "3") int limit
    ) {
        List<SessionFormationDTO> dtos = sessionRepository
                .findUpcomingSessionsByFormateurId(formateurId, java.time.LocalDate.now()) // <-- ajouter today
                .stream()
                .sorted((s1, s2) -> s1.getPlanning().getSemaine()
                        .compareTo(s2.getPlanning().getSemaine()))
                .limit(limit)
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
    
}
