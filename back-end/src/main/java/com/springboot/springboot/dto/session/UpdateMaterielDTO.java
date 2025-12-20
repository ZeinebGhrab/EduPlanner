package com.springboot.springboot.dto.session;

import java.util.List;

public class UpdateMaterielDTO {
    private List<Long> materielIds; // IDs des matériels à associer

    // getters et setters
    public List<Long> getMaterielIds() {
        return materielIds;
    }

    public void setMaterielIds(List<Long> materielIds) {
        this.materielIds = materielIds;
    }
}