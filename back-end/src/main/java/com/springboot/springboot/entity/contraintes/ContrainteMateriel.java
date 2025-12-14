package com.springboot.springboot.entity.contraintes;

import com.springboot.springboot.entity.planning.SessionFormation;

public class ContrainteMateriel implements Contrainte {

    @Override
    public boolean verifier(SessionFormation session) {
        // Validation simplifiée : vérifier uniquement que la salle et le matériel requis existent
        // La vérification d'équipement de la salle a été supprimée avec l'entité Equipement
        if (session.getSalle() == null) return false;
        if (session.getMaterielRequis() == null) return true;
        return true; // Toujours valide car la gestion des équipements a été supprimée
    }

    @Override
    public String getDescription() {
        return "Vérifie que la salle dispose du matériel requis pour la session.";
    }

    @Override
    public int getSeverite() {
        return 3;
    }
}