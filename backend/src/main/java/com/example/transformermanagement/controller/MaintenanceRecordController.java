package com.example.transformermanagement.controller;

import com.example.transformermanagement.dto.MaintenanceRecordRequest;
import com.example.transformermanagement.dto.MaintenanceRecordResponse;
import com.example.transformermanagement.service.MaintenanceRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance-records")
public class MaintenanceRecordController {

    @Autowired
    private MaintenanceRecordService maintenanceRecordService;

    /**
     * FR4.1: Create a new maintenance record
     * POST /api/maintenance-records
     */
    @PostMapping
    public ResponseEntity<MaintenanceRecordResponse> createMaintenanceRecord(
            @RequestBody MaintenanceRecordRequest request) {
        try {
            MaintenanceRecordResponse response = maintenanceRecordService.createMaintenanceRecord(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * FR4.2: Update a maintenance record with engineer input
     * PUT /api/maintenance-records/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceRecordResponse> updateMaintenanceRecord(
            @PathVariable UUID id,
            @RequestBody MaintenanceRecordRequest request) {
        try {
            MaintenanceRecordResponse response = maintenanceRecordService.updateMaintenanceRecord(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * FR4.3: Get a maintenance record by ID
     * GET /api/maintenance-records/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecordResponse> getMaintenanceRecordById(@PathVariable UUID id) {
        Optional<MaintenanceRecordResponse> record = maintenanceRecordService.getMaintenanceRecordById(id);
        return record.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * FR4.3: Get all maintenance records
     * GET /api/maintenance-records
     */
    @GetMapping
    public ResponseEntity<List<MaintenanceRecordResponse>> getAllMaintenanceRecords(
            @RequestParam(required = false) UUID transformerId,
            @RequestParam(required = false) UUID inspectionId) {
        
        if (transformerId != null) {
            // Get all records for a specific transformer
            List<MaintenanceRecordResponse> records = maintenanceRecordService.getTransformerMaintenanceRecords(transformerId);
            return ResponseEntity.ok(records);
        }
        
        if (inspectionId != null) {
            // Get record for a specific inspection
            Optional<MaintenanceRecordResponse> record = maintenanceRecordService.getRecordByInspection(inspectionId);
            return record.map(r -> ResponseEntity.ok(List.of(r)))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        
        // Get all maintenance records
        List<MaintenanceRecordResponse> records = maintenanceRecordService.getAllMaintenanceRecords();
        return ResponseEntity.ok(records);
    }

    /**
     * FR4.3: Get maintenance record history for a transformer
     * GET /api/maintenance-records/history/{transformerId}
     */
    @GetMapping("/history/{transformerId}")
    public ResponseEntity<List<MaintenanceRecordResponse>> getTransformerRecordHistory(
            @PathVariable UUID transformerId) {
        List<MaintenanceRecordResponse> records = maintenanceRecordService.getTransformerRecordHistory(transformerId);
        return ResponseEntity.ok(records);
    }

    /**
     * Get maintenance record by record number
     * GET /api/maintenance-records/number/{recordNo}
     */
    @GetMapping("/number/{recordNo}")
    public ResponseEntity<MaintenanceRecordResponse> getMaintenanceRecordByNumber(
            @PathVariable String recordNo) {
        Optional<MaintenanceRecordResponse> record = maintenanceRecordService.getMaintenanceRecordByNumber(recordNo);
        return record.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * FR4.3: Delete a maintenance record
     * DELETE /api/maintenance-records/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenanceRecord(@PathVariable UUID id) {
        maintenanceRecordService.deleteMaintenanceRecord(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Check if a maintenance record exists for a transformer and inspection
     * GET /api/maintenance-records/check
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkRecordExists(
            @RequestParam UUID transformerId,
            @RequestParam UUID inspectionId) {
        boolean exists = maintenanceRecordService.recordExistsForInspection(transformerId, inspectionId);
        return ResponseEntity.ok(exists);
    }
}
