package com.springboot.springboot.dto.admin;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatistiquesDTO {
    private int id;
    private String typeStat;
    private Integer valeurNumerique;
    private BigDecimal valeurDecimal;
    private String valeurTexte;
    private LocalDateTime dateCalcul;
    private String description;
}
