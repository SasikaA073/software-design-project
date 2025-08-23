package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {
    @Autowired
    private InspectionService inspectionService;

    @GetMapping
    public List<Inspection> getAllInspections() {
        return inspectionService.getAllInspections();
    }

    @GetMapping("/{id}")
    public Optional<Inspection> getInspectionById(@PathVariable java.util.UUID id) {
        return inspectionService.getInspectionById(id);
    }

    @PostMapping
    public Inspection createInspection(@RequestBody Inspection inspection) {
        return inspectionService.saveInspection(inspection);
    }

    @PutMapping("/{id}")
    public Inspection updateInspection(@PathVariable java.util.UUID id, @RequestBody Inspection inspectionDetails) {
        Inspection inspection = inspectionService.getInspectionById(id).orElseThrow();
        inspection.setInspectionNo(inspectionDetails.getInspectionNo());
        inspection.setInspectedDate(inspectionDetails.getInspectedDate());
        inspection.setMaintenanceDate(inspectionDetails.getMaintenanceDate());
        inspection.setStatus(inspectionDetails.getStatus());
        inspection.setInspectedBy(inspectionDetails.getInspectedBy());
        inspection.setWeatherCondition(inspectionDetails.getWeatherCondition());
        return inspectionService.saveInspection(inspection);
    }

    @DeleteMapping("/{id}")
    public void deleteInspection(@PathVariable java.util.UUID id) {
        inspectionService.deleteInspection(id);
    }
}
