package com.springboot.springboot.entity.contraintes;

import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.entity.planning.SessionFormation;

public class ContrainteDisponibilite implements Contrainte {

    @Override
    public boolean verifier(SessionFormation session) {
        if (session.getCreneaux() == null || session.getCreneaux().isEmpty()) return false;

        // Vérifier pour chaque créneau de la session
        return session.getCreneaux().stream()
                .allMatch(creneau -> verifierSalle(session, creneau) && 
                                    verifierFormateur(session, creneau) && 
                                    verifierGroupe(session, creneau));
    }

    private boolean verifierSalle(SessionFormation session, Creneau creneau) {
        if (session.getSalle() != null) {
            return session.getSalle().estDisponible(creneau);
        }
        return false; // salle non définie = échec
    }

    private boolean verifierFormateur(SessionFormation session, Creneau creneau) {
        if (session.getFormateur() != null) {
            return session.getFormateur().estDisponible(creneau);
        }
        return false; // formateur non défini = échec
    }

    private boolean verifierGroupe(SessionFormation session, Creneau creneau) {
        if (session.getGroupe() != null) {
            return session.getGroupe().getSessions().stream()
                    .filter(s -> !s.equals(session)) // exclure la session en cours
                    .noneMatch(s -> s.getCreneaux() != null && 
                                   s.getCreneaux().stream().anyMatch(c -> c.chevauche(creneau)));
        }
        return false; // groupe non défini = échec
    }

    @Override
    public String getDescription() {
        return "Vérifie la disponibilité du formateur, de la salle et du groupe aux créneaux choisis.";
    }

    @Override
    public int getSeverite() {
        return 5;
    }
}
