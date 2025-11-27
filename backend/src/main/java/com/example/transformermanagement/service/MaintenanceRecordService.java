package com.example.transformermanagement.service;

import com.example.transformermanagement.dto.MaintenanceRecordRequest;
import com.example.transformermanagement.dto.MaintenanceRecordResponse;
import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.model.MaintenanceRecord;
import com.example.transformermanagement.model.Transformer;
import com.example.transformermanagement.repository.MaintenanceRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class MaintenanceRecordService {
    
    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private TransformerService transformerService;

    @Autowired
    private InspectionService inspectionService;

    /**
     * FR4.1: Create a new maintenance record from inspection data
     */
    public MaintenanceRecordResponse createMaintenanceRecord(MaintenanceRecordRequest request) {
        Transformer transformer = transformerService.getTransformerById(request.transformerId())
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
        
        Inspection inspection = inspectionService.getInspectionById(request.inspectionId())
                .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));

        MaintenanceRecord record = new MaintenanceRecord();
        record.setTransformer(transformer);
        record.setInspection(inspection);
        record.setInspectionTimestamp(inspection.getInspectedDate());
        record.setThermalImageUrl(request.thermalImageUrl());
        record.setThermalImageThumbnailUrl(request.thermalImageThumbnailUrl());
        record.setAnomalyMarkersData(request.anomalyMarkersData());
        record.setVersionNumber(1);
        record.setLastModifiedBy(request.lastModifiedBy());

        MaintenanceRecord saved = maintenanceRecordRepository.save(record);
        return convertToResponse(saved);
    }

    /**
     * FR4.2: Update maintenance record with engineer input fields
     */
    public MaintenanceRecordResponse updateMaintenanceRecord(UUID recordId, MaintenanceRecordRequest request) {
        MaintenanceRecord record = maintenanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found"));

        // Update engineer input fields
        record.setInspectorName(request.inspectorName());
        
        if (request.transformerStatus() != null) {
            try {
                record.setTransformerStatus(
                    MaintenanceRecord.TransformerStatus.valueOf(request.transformerStatus())
                );
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid transformer status: " + request.transformerStatus());
            }
        }

        record.setVoltage(request.voltage());
        record.setCurrent(request.current());
        record.setFrequency(request.frequency());
        record.setLoadPercentage(request.loadPercentage());
        record.setNotes(request.notes());
        record.setComments(request.comments());
        record.setRecommendedAction(request.recommendedAction());
        record.setAdditionalRemarks(request.additionalRemarks());
        record.setActionDueDate(request.actionDueDate());
        record.setLastModifiedBy(request.lastModifiedBy());

        // Increment version number on update
        record.setVersionNumber(record.getVersionNumber() + 1);

        MaintenanceRecord updated = maintenanceRecordRepository.save(record);
        return convertToResponse(updated);
    }

    /**
     * FR4.3: Retrieve a maintenance record by ID
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceRecordResponse> getMaintenanceRecordById(UUID recordId) {
        return maintenanceRecordRepository.findById(recordId)
                .map(this::convertToResponse);
    }

    /**
     * FR4.3: Get all maintenance records for a transformer
     */
    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> getTransformerMaintenanceRecords(UUID transformerId) {
        return maintenanceRecordRepository.findByTransformerIdWithDetails(transformerId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * FR4.3: Get record history for a transformer (with versioning support)
     */
    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> getTransformerRecordHistory(UUID transformerId) {
        return maintenanceRecordRepository.findTransformerRecordHistory(transformerId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all maintenance records
     */
    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> getAllMaintenanceRecords() {
        return maintenanceRecordRepository.findAllWithDetails()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get maintenance record by record number
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceRecordResponse> getMaintenanceRecordByNumber(String recordNo) {
        return maintenanceRecordRepository.findByRecordNo(recordNo)
                .map(this::convertToResponse);
    }

    /**
     * Delete a maintenance record
     */
    public void deleteMaintenanceRecord(UUID recordId) {
        maintenanceRecordRepository.deleteById(recordId);
    }

    /**
     * Get maintenance record for a specific inspection
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceRecordResponse> getRecordByInspection(UUID inspectionId) {
        return maintenanceRecordRepository.findByInspectionIdWithDetails(inspectionId)
                .map(this::convertToResponse);
    }

    /**
     * Check if a record exists for a transformer and inspection
     */
    @Transactional(readOnly = true)
    public boolean recordExistsForInspection(UUID transformerId, UUID inspectionId) {
        return maintenanceRecordRepository.findByTransformerAndInspection(transformerId, inspectionId)
                .isPresent();
    }

    /**
     * Convert entity to response DTO
     */
    private MaintenanceRecordResponse convertToResponse(MaintenanceRecord record) {
        return new MaintenanceRecordResponse(
                record.getId(),
                record.getRecordNo(),
                record.getTransformer().getId(),
                record.getTransformer().getTransformerNo(),
                record.getInspection().getId(),
                record.getInspection().getInspectionNo(),
                record.getInspectionTimestamp(),
                record.getThermalImageUrl(),
                record.getThermalImageThumbnailUrl(),
                record.getAnomalyMarkersData(),
                record.getInspectorName(),
                record.getTransformerStatus() != null ? record.getTransformerStatus().toString() : null,
                record.getVoltage(),
                record.getCurrent(),
                record.getFrequency(),
                record.getLoadPercentage(),
                record.getNotes(),
                record.getComments(),
                record.getRecommendedAction(),
                record.getAdditionalRemarks(),
                record.getActionDueDate(),
                record.getVersionNumber(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.getLastModifiedBy()
        );
    }
}
