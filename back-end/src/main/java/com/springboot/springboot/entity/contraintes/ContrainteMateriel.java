package com.springboot.springboot.entity.contraintes;

import com.springboot.springboot.entity.planning.SessionFormation;

public class ContrainteMateriel implements Contrainte {

    @Override
    public boolean verifier(SessionFormation session) {
        if (session.getSalle() == null) return false;
        if (session.getMaterielRequis() == null) return true;
        return true; 
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