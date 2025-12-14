package com.springboot.springboot.repository.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.planning.Conflit;

@Repository
public interface ConflitRepository extends JpaRepository<Conflit, Integer> {
}