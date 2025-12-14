package com.springboot.springboot.entity.admin;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "statistiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Statistiques {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    
    @Column(name = "type_stat", nullable = false, length = 100)
    private String typeStat;
    
    @Column(name = "valeur_numerique")
    private Integer valeurNumerique;
    
    @Column(name = "valeur_decimal", precision = 10, scale = 2)
    private BigDecimal valeurDecimal;
    
    @Column(name = "valeur_texte", columnDefinition = "TEXT")
    private String valeurTexte;
    
    @Column(name = "date_calcul")
    private LocalDateTime dateCalcul = LocalDateTime.now();
    
    @Column(length = 255)
    private String description;
}
