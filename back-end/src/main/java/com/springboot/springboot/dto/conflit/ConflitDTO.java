package com.springboot.springboot.dto.conflit;

import com.springboot.springboot.entity.planning.Conflit;
import com.springboot.springboot.entity.planning.SessionFormation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ConflitDTO {

    private int id;
    private String type;
    private String description;
    private Integer severite;
    private LocalDateTime dateDetection;
    private Integer creneauId;

    // ✅ AJOUTS
    private Integer planningId;
    private List<SessionImpliqueeDTO> sessionsImpliquees;

    /* =======================
       Classe interne Session
       ======================= */
    public static class SessionImpliqueeDTO {
        private int id;
        private String nomCours;
        private Integer planningId;

        public SessionImpliqueeDTO() {}

        public SessionImpliqueeDTO(int id, String nomCours, Integer planningId) {
            this.id = id;
            this.nomCours = nomCours;
            this.planningId = planningId;
        }

        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }

        public String getNomCours() {
            return nomCours;
        }

        public void setNomCours(String nomCours) {
            this.nomCours = nomCours;
        }

        public Integer getPlanningId() {
            return planningId;
        }

        public void setPlanningId(Integer planningId) {
            this.planningId = planningId;
        }
    }

    /* =======================
       Constructeurs
       ======================= */
    public ConflitDTO() {}

    public ConflitDTO(
            int id,
            String type,
            String description,
            Integer severite,
            LocalDateTime dateDetection,
            Integer creneauId,
            Integer planningId,
            List<SessionImpliqueeDTO> sessionsImpliquees
    ) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.severite = severite;
        this.dateDetection = dateDetection;
        this.creneauId = creneauId;
        this.planningId = planningId;
        this.sessionsImpliquees = sessionsImpliquees;
    }

    /* =======================
       Factory method UNIQUE
       ======================= */
    public static ConflitDTO fromEntity(Conflit conflit) {

        Integer planningId = null;
        List<SessionImpliqueeDTO> sessionsDTO = new ArrayList<>();

        if (conflit.getSessionsImpliquees() != null) {
            for (SessionFormation session : conflit.getSessionsImpliquees()) {

                if (planningId == null && session.getPlanning() != null) {
                    planningId = session.getPlanning().getId();
                }

                Integer sessionPlanningId =
                        session.getPlanning() != null ? session.getPlanning().getId() : null;

                sessionsDTO.add(
                        new SessionImpliqueeDTO(
                                session.getId(),
                                session.getNomCours(),
                                sessionPlanningId
                        )
                );
            }
        }

        return new ConflitDTO(
                conflit.getId(),
                conflit.getType() != null ? conflit.getType().name() : null,
                conflit.getDescription(),
                conflit.getSeverite(),
                conflit.getDateDetection(),
                conflit.getCreneau() != null ? conflit.getCreneau().getId() : null,
                planningId,
                sessionsDTO
        );
    }

    /* =======================
       Getters & Setters
       ======================= */
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

    public Integer getCreneauId() {
        return creneauId;
    }

    public void setCreneauId(Integer creneauId) {
        this.creneauId = creneauId;
    }

    public Integer getPlanningId() {
        return planningId;
    }

    public void setPlanningId(Integer planningId) {
        this.planningId = planningId;
    }

    public List<SessionImpliqueeDTO> getSessionsImpliquees() {
        return sessionsImpliquees;
    }

    public void setSessionsImpliquees(List<SessionImpliqueeDTO> sessionsImpliquees) {
        this.sessionsImpliquees = sessionsImpliquees;
    }
}
