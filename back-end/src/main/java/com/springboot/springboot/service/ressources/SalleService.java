package com.springboot.springboot.service.ressources;

import com.springboot.springboot.entity.ressources.Salle;
import com.springboot.springboot.repository.ressources.SalleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SalleService {

    @Autowired
    private SalleRepository repository;

    public List<Salle> findAll() {
        return repository.findAll();
    }

    public Optional<Salle> findById(int id) {
        return repository.findById(id);
    }

    public Salle save(Salle salle) {
        return repository.save(salle);
    }

    public void deleteById(int id) {
        repository.deleteById(id);
    }
}