package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.model.Transformer;
import com.example.transformermanagement.service.InspectionService;
import com.example.transformermanagement.service.TransformerService;
import com.example.transformermanagement.dto.InspectionRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {
    @Autowired
    private InspectionService inspectionService;

    @Autowired
    private TransformerService transformerService;

    @GetMapping
    public List<Inspection> getAllInspections(@RequestParam(required = false) UUID transformerId) {
        if (transformerId != null) {
            return inspectionService.getInspectionsByTransformerId(transformerId);
        }
        return inspectionService.getAllInspections();
    }

    @GetMapping("/{id}")
    public Optional<Inspection> getInspectionById(@PathVariable java.util.UUID id) {
        return inspectionService.getInspectionById(id);
    }

    @PostMapping
    public Inspection createInspection(@RequestBody InspectionRequest request) {
        Transformer transformer = transformerService.getTransformerById(request.transformerId())
                .orElseThrow();
        Inspection inspection = new Inspection();
        inspection.setInspectionNo(request.inspectionNo());
        inspection.setTransformer(transformer);
        inspection.setInspectedDate(request.inspectedDate());
        inspection.setMaintenanceDate(request.maintenanceDate());
        inspection.setStatus(request.status());
        inspection.setInspectedBy(request.inspectedBy());
        inspection.setWeatherCondition(request.weatherCondition());
        return inspectionService.saveInspection(inspection);
    }

    @PutMapping("/{id}")
    public Inspection updateInspection(@PathVariable java.util.UUID id, @RequestBody InspectionRequest request) {
        Inspection inspection = inspectionService.getInspectionById(id).orElseThrow();
        
        // Only update the fields that are provided and not null
        if (request.inspectionNo() != null) {
            inspection.setInspectionNo(request.inspectionNo());
        }
        if (request.inspectedDate() != null) {
            inspection.setInspectedDate(request.inspectedDate());
        }
        if (request.maintenanceDate() != null) {
            inspection.setMaintenanceDate(request.maintenanceDate());
        }
        if (request.status() != null) {
            inspection.setStatus(request.status());
        }
        if (request.inspectedBy() != null) {
            inspection.setInspectedBy(request.inspectedBy());
        }
        if (request.weatherCondition() != null) {
            inspection.setWeatherCondition(request.weatherCondition());
        }
        
        // Don't change transformer relationship during update
        // if (request.transformerId() != null) {
        //     Transformer transformer = transformerService.getTransformerById(request.transformerId()).orElseThrow();
        //     inspection.setTransformer(transformer);
        // }
        
        return inspectionService.saveInspection(inspection);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable java.util.UUID id) {
        try {
            inspectionService.deleteInspection(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Failed to delete inspection: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
