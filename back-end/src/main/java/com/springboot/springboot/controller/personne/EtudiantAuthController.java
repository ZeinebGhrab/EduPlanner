package com.springboot.springboot.controller.personne;
import com.springboot.springboot.dto.admin.LoginRequestDTO;
import com.springboot.springboot.dto.admin.LoginResponseDTO;
import com.springboot.springboot.entity.personne.Etudiant;
import com.springboot.springboot.entity.personne.Indisponibilite;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.service.personne.EtudiantService;
import com.springboot.springboot.service.admin.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


/**
 * Controller pour les opérations authentifiées des étudiants
 */
@RestController
@RequestMapping("/api/etudiant")
public class EtudiantAuthController {
    
    @Autowired
    private EtudiantService etudiantService;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * Login pour étudiant - retourne JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        Optional<Etudiant> etudiantOpt = etudiantService.findByEmail(request.getEmail());
        
        if (etudiantOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Identifiants invalides");
        }
        
        Etudiant etudiant = etudiantOpt.get();
        
        if (!etudiant.getActif()) {
            return ResponseEntity.status(403).body("Compte désactivé");
        }
        
        if (!etudiantService.verifyPassword(request.getPassword(), etudiant.getPassword())) {
            return ResponseEntity.status(401).body("Identifiants invalides");
        }
        
        String token = jwtService.generateToken(etudiant.getEmail(), "ETUDIANT");
        
        return ResponseEntity.ok(new LoginResponseDTO(token, etudiant.getEmail(), "ETUDIANT"));
    }
    
    /**
     * Récupère les informations de l'étudiant connecté
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentEtudiant(Authentication auth) {
        String email = auth.getName();
        Optional<Etudiant> etudiantOpt = etudiantService.findByEmail(email);
        
        if (etudiantOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Étudiant non trouvé");
        }
        
        return ResponseEntity.ok(etudiantOpt.get());
    }
    
    /**
     * Inscription à un groupe
     */
    @PostMapping("/inscription/{groupeId}")
    public ResponseEntity<?> registerToGroupe(
            @PathVariable int groupeId,
            Authentication auth) {
        String email = auth.getName();
        Optional<Etudiant> etudiantOpt = etudiantService.findByEmail(email);
        
        if (etudiantOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Étudiant non trouvé");
        }
        
        try {
            boolean success = etudiantService.registerToGroupe(etudiantOpt.get().getId(), groupeId);
            if (success) {
                return ResponseEntity.ok("Inscription réussie");
            } else {
                return ResponseEntity.status(400).body("Échec de l'inscription");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }
    
    /**
     * Récupère le planning personnel (sessions via groupes)
     */
    @GetMapping("/planning")
    public ResponseEntity<List<SessionFormation>> getMyPlanning(Authentication auth) {
        String email = auth.getName();
        Optional<Etudiant> etudiantOpt = etudiantService.findByEmail(email);
        
        if (etudiantOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        List<SessionFormation> sessions = etudiantService.getSessionsByEtudiantId(etudiantOpt.get().getId());
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Recherche de sessions avec filtres
     */
    @GetMapping("/sessions/search")
    public ResponseEntity<List<SessionFormation>> searchSessions(
            @RequestParam(required = false) Integer groupeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        
        List<SessionFormation> sessions = etudiantService.searchSessions(groupeId, dateDebut, dateFin);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Déclare une indisponibilité urgente
     */
    @PostMapping("/indisponibilites/urgente")
    public ResponseEntity<?> declareUrgentIndisponibilite(
            @RequestBody Indisponibilite indispo,
            Authentication auth) {
        String email = auth.getName();
        Optional<Etudiant> etudiantOpt = etudiantService.findByEmail(email);
        
        if (etudiantOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Étudiant non trouvé");
        }
        
        Indisponibilite saved = etudiantService.declareUrgentIndisponibilite(etudiantOpt.get().getId(), indispo);
        return ResponseEntity.ok(saved);
    }
    
    /**
     * Récupère toutes les indisponibilités de l'étudiant
     */
    @GetMapping("/indisponibilites")
    public ResponseEntity<List<Indisponibilite>> getMyIndisponibilites(Authentication auth) {
        String email = auth.getName();
        Optional<Etudiant> etudiantOpt = etudiantService.findByEmail(email);
        
        if (etudiantOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        List<Indisponibilite> indispos = etudiantService.getIndisponibilites(etudiantOpt.get().getId());
        return ResponseEntity.ok(indispos);
    }
}
