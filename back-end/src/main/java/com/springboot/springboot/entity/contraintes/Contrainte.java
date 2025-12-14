package com.springboot.springboot.entity.contraintes;

import com.springboot.springboot.entity.planning.SessionFormation;

public interface Contrainte {

    boolean verifier(SessionFormation session);

    String getDescription();

    int getSeverite();
}