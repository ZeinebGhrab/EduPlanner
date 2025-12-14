package com.springboot.springboot.controller.personne;

import com.springboot.springboot.dto.admin.LoginRequestDTO;
import com.springboot.springboot.dto.admin.LoginResponseDTO;
import com.springboot.springboot.entity.personne.Formateur;
import com.springboot.springboot.entity.personne.Indisponibilite;
import com.springboot.springboot.entity.planning.SessionFormation;
import com.springboot.springboot.service.personne.FormateurService;
import com.springboot.springboot.service.admin.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controller pour les opérations authentifiées des formateurs
 */
@RestController
@RequestMapping("/api/formateur")
public class FormateurAuthController {
    
    @Autowired
    private FormateurService formateurService;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * Login pour formateur - retourne JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        Optional<Formateur> formateurOpt = formateurService.findByEmail(request.getEmail());
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Identifiants invalides");
        }
        
        Formateur formateur = formateurOpt.get();
        
        if (!formateur.getActif()) {
            return ResponseEntity.status(403).body("Compte désactivé");
        }
        
        if (!formateurService.verifyPassword(request.getPassword(), formateur.getPassword())) {
            return ResponseEntity.status(401).body("Identifiants invalides");
        }
        
        String token = jwtService.generateToken(formateur.getEmail(), "FORMATEUR");
        
        return ResponseEntity.ok(new LoginResponseDTO(token, formateur.getEmail(), "FORMATEUR"));
    }
    
    /**
     * Récupère les informations du formateur connecté
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentFormateur(Authentication auth) {
        String email = auth.getName();
        Optional<Formateur> formateurOpt = formateurService.findByEmail(email);
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Formateur non trouvé");
        }
        
        return ResponseEntity.ok(formateurOpt.get());
    }
    
    /**
     * Récupère toutes les sessions du formateur connecté
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<SessionFormation>> getMySessions(Authentication auth) {
        String email = auth.getName();
        Optional<Formateur> formateurOpt = formateurService.findByEmail(email);
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        List<SessionFormation> sessions = formateurService.getSessionsByFormateurId(formateurOpt.get().getId());
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Récupère les sessions futures du formateur
     */
    @GetMapping("/sessions/futures")
    public ResponseEntity<List<SessionFormation>> getFutureSessions(Authentication auth) {
        String email = auth.getName();
        Optional<Formateur> formateurOpt = formateurService.findByEmail(email);
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        List<SessionFormation> sessions = formateurService.getFutureSessionsByFormateur(formateurOpt.get().getId());
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Déclare une indisponibilité
     */
    @PostMapping("/indisponibilites")
    public ResponseEntity<?> declareIndisponibilite(
            @RequestBody Indisponibilite indispo,
            Authentication auth) {
        String email = auth.getName();
        Optional<Formateur> formateurOpt = formateurService.findByEmail(email);
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Formateur non trouvé");
        }
        
        Indisponibilite saved = formateurService.declareIndisponibilite(formateurOpt.get().getId(), indispo);
        return ResponseEntity.ok(saved);
    }
    
    /**
     * Récupère toutes les indisponibilités du formateur
     */
    @GetMapping("/indisponibilites")
    public ResponseEntity<List<Indisponibilite>> getMyIndisponibilites(Authentication auth) {
        String email = auth.getName();
        Optional<Formateur> formateurOpt = formateurService.findByEmail(email);
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        
        List<Indisponibilite> indispos = formateurService.getIndisponibilites(formateurOpt.get().getId());
        return ResponseEntity.ok(indispos);
    }
    
    /**
     * Valide un cours assigné
     */
    @PutMapping("/sessions/{sessionId}/valider")
    public ResponseEntity<?> validateCourse(
            @PathVariable int sessionId,
            Authentication auth) {
        String email = auth.getName();
        Optional<Formateur> formateurOpt = formateurService.findByEmail(email);
        
        if (formateurOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Formateur non trouvé");
        }
        
        SessionFormation session = formateurService.validateCourse(formateurOpt.get().getId(), sessionId);
        
        if (session == null) {
            return ResponseEntity.status(404).body("Session non trouvée ou non assignée à ce formateur");
        }
        
        return ResponseEntity.ok(session);
    }
}
