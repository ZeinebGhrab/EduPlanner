package com.springboot.springboot.controller.admin;

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

import com.springboot.springboot.dto.admin.AdminDTO;
import com.springboot.springboot.dto.admin.LoginRequest;
import com.springboot.springboot.dto.admin.LoginResponse;
import com.springboot.springboot.entity.admin.Admin;
import com.springboot.springboot.service.admin.AdminService;
import com.springboot.springboot.service.admin.JwtService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * Login - Authentification
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return adminService.findByEmail(request.getEmail())
                .map(admin -> {
                    if (!admin.getActif()) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Compte désactivé");
                    }

                    if (adminService.verifyPassword(request.getPassword(), (String) admin.getPassword())) {
                        String token = jwtService.generateToken(admin.getEmail(), admin.getRole());

                        // Création du DTO via constructeur AllArgsConstructor
                        AdminDTO adminDTO = new AdminDTO(
                            admin.getId(),
                            admin.getEmail(),
                            admin.getNom(),
                            admin.getPrenom(),
                            admin.getRole(),
                            admin.getActif()
                        );

                        // Création du LoginResponse via constructeur AllArgsConstructor
                        LoginResponse response = new LoginResponse(
                            token,
                            "Bearer",
                            adminDTO
                        );

                        return ResponseEntity.ok(response);
                    }

                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Mot de passe incorrect");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Utilisateur non trouvé"));
    }

    
    /**
     * Lister tous les admins
     */
    @GetMapping
    public ResponseEntity<List<AdminDTO>> getAll() {
        return ResponseEntity.ok(adminService.findAll());
    }
    
    /**
     * Récupérer un admin par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminDTO> getById(@PathVariable int id) {
        return adminService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Créer un admin
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Admin admin) {
        try {
            AdminDTO created = adminService.createAdmin(admin);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
    
    /**
     * Modifier un admin
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody Admin admin) {
        try {
            AdminDTO updated = adminService.updateAdmin(id, admin);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    /**
     * Supprimer un admin
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        adminService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
