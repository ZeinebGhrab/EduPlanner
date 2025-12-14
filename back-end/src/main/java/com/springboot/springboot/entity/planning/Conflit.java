package com.springboot.springboot.entity.planning;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conflit")
public class Conflit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TypeConflit type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer severite;

    @Column(name = "date_detection", nullable = false)
    private LocalDateTime dateDetection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creneau_id")
    private Creneau creneau;

    @ManyToMany
    @JoinTable(
        name = "conflit_session",
        joinColumns = @JoinColumn(name = "conflit_id"),
        inverseJoinColumns = @JoinColumn(name = "session_id")
    )
    private List<SessionFormation> sessionsImpliquees = new ArrayList<>();

    public enum TypeConflit {
        CHEVAUCHEMENT_SESSION,
        CONFLIT_FORMATEUR,
        CONFLIT_SALLE,
        CONFLIT_MATERIEL,
        CONFLIT_GROUPE,
        CONTRAINTE_NON_RESPECTEE
    }

    public Conflit() {
        this.dateDetection = LocalDateTime.now();
    }

    // Getters et Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public TypeConflit getType() { return type; }
    public void setType(TypeConflit type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSeverite() { return severite; }
    public void setSeverite(Integer severite) { this.severite = severite; }
    public LocalDateTime getDateDetection() { return dateDetection; }
    public void setDateDetection(LocalDateTime dateDetection) { this.dateDetection = dateDetection; }
    public Creneau getCreneau() { return creneau; }
    public void setCreneau(Creneau creneau) { this.creneau = creneau; }
    public List<SessionFormation> getSessionsImpliquees() { return sessionsImpliquees; }
    public void setSessionsImpliquees(List<SessionFormation> sessionsImpliquees) { this.sessionsImpliquees = sessionsImpliquees; }
}
