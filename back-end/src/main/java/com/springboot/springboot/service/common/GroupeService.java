package com.springboot.springboot.service.common;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.springboot.entity.common.Groupe;
import com.springboot.springboot.entity.personne.Etudiant;
import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.repository.common.GroupeRepository;
import com.springboot.springboot.repository.personne.EtudiantRepository;

@Service
public class GroupeService {

    @Autowired
    private GroupeRepository groupeRepo;

    @Autowired
    private EtudiantRepository etudiantRepo;

    

    // ---------------------- CRUD ------------------------

    public List<Groupe> findAll() {
        return groupeRepo.findAll();
    }

    public Optional<Groupe> findById(int id) {
        return groupeRepo.findById(id);
    }

    public Groupe save(Groupe groupe) {
        return groupeRepo.save(groupe);
    }

    public void deleteById(int id) {
        groupeRepo.deleteById(id);
    }

    // ---------------------- LOGIQUE METIER ------------------------

    public Groupe ajouterEtudiant(int idGroupe, int idEtudiant) {
        Groupe g = groupeRepo.findById(idGroupe)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));

        Etudiant e = etudiantRepo.findById(idEtudiant)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        if (g.estComplet()) {
            throw new RuntimeException("Le groupe est complet");
        }

        if (!g.getEtudiants().contains(e)) {
            g.getEtudiants().add(e);
            e.getGroupes().add(g);
            g.setEffectif(g.getEffectif() + 1);
        }

        return groupeRepo.save(g);
    }

    public Groupe retirerEtudiant(int idGroupe, int idEtudiant) {
        Groupe g = groupeRepo.findById(idGroupe)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));

        Etudiant e = etudiantRepo.findById(idEtudiant)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        if (g.getEtudiants().contains(e)) {
            g.getEtudiants().remove(e);
            e.getGroupes().remove(g);
            g.setEffectif(g.getEffectif() - 1);
        }

        return groupeRepo.save(g);
    }

    public boolean estCreneauLibre(int idGroupe, Creneau creneau) {
        Groupe g = groupeRepo.findById(idGroupe)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));

        return g.getSessions().stream()
                .noneMatch(s -> s.getCreneaux() != null && 
                               s.getCreneaux().stream().anyMatch(c -> c.chevauche(creneau)));
    }
}
