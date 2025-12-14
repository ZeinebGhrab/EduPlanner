package com.springboot.springboot.repository.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.springboot.entity.planning.Planning;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, Integer> {
}
