package com.springboot.springboot.repository.ressources;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.ressources.Salle;

@Repository
public interface SalleRepository extends JpaRepository<Salle, Integer> {
}