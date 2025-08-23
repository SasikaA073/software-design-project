package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Transformer;
import com.example.transformermanagement.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TransformerService {
    @Autowired
    private TransformerRepository transformerRepository;

    public List<Transformer> getAllTransformers() {
        return transformerRepository.findAll();
    }

    public Optional<Transformer> getTransformerById(java.util.UUID id) {
        return transformerRepository.findById(id);
    }

    public Transformer saveTransformer(Transformer transformer) {
        return transformerRepository.save(transformer);
    }

    public void deleteTransformer(java.util.UUID id) {
        transformerRepository.deleteById(id);
    }
}
