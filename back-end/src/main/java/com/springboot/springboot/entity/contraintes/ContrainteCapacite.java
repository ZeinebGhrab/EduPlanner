package com.springboot.springboot.entity.contraintes;

import com.springboot.springboot.entity.planning.SessionFormation;

public class ContrainteCapacite implements Contrainte {

    @Override
    public boolean verifier(SessionFormation session) {
        if (session.getSalle() == null || session.getGroupe() == null) return false;
        return session.getSalle().getCapacite() >= session.getGroupe().getEffectif();
    }

    @Override
    public String getDescription() {
        return "Vérifie si la salle peut accueillir le nombre d’étudiants du groupe.";
    }

    @Override
    public int getSeverite() {
        return 4;
    }
}
