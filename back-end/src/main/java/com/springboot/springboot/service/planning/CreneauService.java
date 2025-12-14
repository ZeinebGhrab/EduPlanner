package com.springboot.springboot.service.planning;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.springboot.entity.planning.Creneau;
import com.springboot.springboot.repository.planning.CreneauRepository;

@Service
public class CreneauService {

    @Autowired
    private CreneauRepository repository;

    public List<Creneau> findAll() {
        return repository.findAll();
    }

    public Optional<Creneau> findById(int id) {
        return repository.findById(id);
    }

    public Creneau save(Creneau creneau) {
        return repository.save(creneau);
    }

    public void deleteById(int id) {
        repository.deleteById(id);
    }
}