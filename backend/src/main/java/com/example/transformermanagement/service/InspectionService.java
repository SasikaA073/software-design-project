package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.repository.InspectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InspectionService {
    @Autowired
    private InspectionRepository inspectionRepository;

    public List<Inspection> getAllInspections() {
        return inspectionRepository.findAll();
    }

    public List<Inspection> getInspectionsByTransformerId(UUID transformerId) {
        return inspectionRepository.findByTransformer_Id(transformerId);
    }

    public Optional<Inspection> getInspectionById(java.util.UUID id) {
        return inspectionRepository.findById(id);
    }

    public Inspection saveInspection(Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    public void deleteInspection(java.util.UUID id) {
        inspectionRepository.deleteById(id);
    }
}
