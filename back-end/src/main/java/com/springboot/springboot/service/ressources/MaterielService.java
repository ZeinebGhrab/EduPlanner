package com.springboot.springboot.service.ressources;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.springboot.entity.ressources.Materiel;
import com.springboot.springboot.repository.ressources.MaterielRepository;

@Service
public class MaterielService {

    @Autowired
    private MaterielRepository repository;

    public List<Materiel> findAll() {
        return repository.findAll();
    }

    public Optional<Materiel> findById(int id) {
        return repository.findById(id);
    }

    public Materiel save(Materiel materiel) {
        return repository.save(materiel);
    }

    public void deleteById(int id) {
        repository.deleteById(id);
    }
}