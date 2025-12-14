package com.springboot.springboot.repository.ressources;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.ressources.Materiel;

@Repository
public interface MaterielRepository extends JpaRepository<Materiel, Integer> {
}