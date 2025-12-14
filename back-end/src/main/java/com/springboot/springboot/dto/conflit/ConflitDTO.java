package com.springboot.springboot.dto.conflit;

import com.springboot.springboot.entity.planning.Conflit;
import java.time.LocalDateTime;

public class ConflitDTO {
    private int id;
    private String type;
    private String description;
    private Integer severite;
    private LocalDateTime dateDetection;
    
    // Constructeurs
    public ConflitDTO() {
        super();
    }

    public ConflitDTO(int id, String description) {
        super();
        this.id = id;
        this.description = description;
    }
    
    public ConflitDTO(int id, String type, String description, Integer severite, LocalDateTime dateDetection) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.severite = severite;
        this.dateDetection = dateDetection;
    }
    
    // Factory method pour créer un DTO depuis une entité
    public static ConflitDTO fromEntity(Conflit conflit) {
        return new ConflitDTO(
            conflit.getId(),
            conflit.getType() != null ? conflit.getType().name() : null,
            conflit.getDescription(),
            conflit.getSeverite(),
            conflit.getDateDetection()
        );
    }

    // Getters et Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSeverite() {
        return severite;
    }

    public void setSeverite(Integer severite) {
        this.severite = severite;
    }

    public LocalDateTime getDateDetection() {
        return dateDetection;
    }

    public void setDateDetection(LocalDateTime dateDetection) {
        this.dateDetection = dateDetection;
    }
}
