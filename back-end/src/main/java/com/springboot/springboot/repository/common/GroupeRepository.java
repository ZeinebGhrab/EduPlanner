package com.springboot.springboot.repository.common;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.common.Groupe;

@Repository
public interface GroupeRepository extends JpaRepository<Groupe, Integer> {
}
