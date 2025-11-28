package com.example.transformermanagement.service;

import com.example.transformermanagement.dto.AnomalyDetailDTO;
import com.example.transformermanagement.dto.MaintenanceRecordRequest;
import com.example.transformermanagement.dto.MaintenanceRecordResponse;
import com.example.transformermanagement.model.Annotation;
import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.model.MaintenanceRecord;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.model.Transformer;
import com.example.transformermanagement.repository.AnnotationRepository;
import com.example.transformermanagement.repository.InspectionRepository;
import com.example.transformermanagement.repository.MaintenanceRecordRepository;
import com.example.transformermanagement.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MaintenanceRecordService {

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private AnnotationRepository annotationRepository;

    public MaintenanceRecordResponse createMaintenanceRecord(MaintenanceRecordRequest request) {
        MaintenanceRecord record = new MaintenanceRecord();
        updateRecordFromRequest(record, request);
        
        Transformer transformer = transformerRepository.findById(request.transformerId())
            .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
        record.setTransformer(transformer);

        Inspection inspection = inspectionRepository.findById(request.inspectionId())
            .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
        record.setInspection(inspection);
        
        // Use inspectedDate as inspectionTimestamp
        record.setInspectionTimestamp(inspection.getInspectedDate() != null ? inspection.getInspectedDate() : java.time.OffsetDateTime.now());

        MaintenanceRecord savedRecord = maintenanceRecordRepository.save(record);
        return mapToResponse(savedRecord);
    }

    public MaintenanceRecordResponse updateMaintenanceRecord(UUID id, MaintenanceRecordRequest request) {
        MaintenanceRecord record = maintenanceRecordRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Maintenance record not found"));
            
        // Increment version number on update
        record.setVersionNumber(record.getVersionNumber() != null ? record.getVersionNumber() + 1 : 2);
        
        updateRecordFromRequest(record, request);
        
        if (!record.getTransformer().getId().equals(request.transformerId())) {
             Transformer transformer = transformerRepository.findById(request.transformerId())
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
            record.setTransformer(transformer);
        }
        
        if (!record.getInspection().getId().equals(request.inspectionId())) {
             Inspection inspection = inspectionRepository.findById(request.inspectionId())
                .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
            record.setInspection(inspection);
            record.setInspectionTimestamp(inspection.getInspectedDate() != null ? inspection.getInspectedDate() : java.time.OffsetDateTime.now());
        }

        MaintenanceRecord savedRecord = maintenanceRecordRepository.save(record);
        return mapToResponse(savedRecord);
    }

    public Optional<MaintenanceRecordResponse> getMaintenanceRecordById(UUID id) {
        return maintenanceRecordRepository.findById(id).map(this::mapToResponse);
    }

    public List<MaintenanceRecordResponse> getTransformerMaintenanceRecords(UUID transformerId) {
        return maintenanceRecordRepository.findByTransformerId(transformerId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public Optional<MaintenanceRecordResponse> getRecordByInspection(UUID inspectionId) {
        return maintenanceRecordRepository.findByInspectionId(inspectionId).map(this::mapToResponse);
    }

    public List<MaintenanceRecordResponse> getAllMaintenanceRecords() {
        return maintenanceRecordRepository.findAll().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public List<MaintenanceRecordResponse> getTransformerRecordHistory(UUID transformerId) {
        return maintenanceRecordRepository.findByTransformerIdOrderByCreatedAtDesc(transformerId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public Optional<MaintenanceRecordResponse> getMaintenanceRecordByNumber(String recordNo) {
        return maintenanceRecordRepository.findByRecordNo(recordNo).map(this::mapToResponse);
    }

    public void deleteMaintenanceRecord(UUID id) {
        maintenanceRecordRepository.deleteById(id);
    }

    public boolean recordExistsForInspection(UUID transformerId, UUID inspectionId) {
        return maintenanceRecordRepository.existsByTransformerIdAndInspectionId(transformerId, inspectionId);
    }

    private void updateRecordFromRequest(MaintenanceRecord record, MaintenanceRecordRequest request) {
        record.setThermalImageUrl(request.thermalImageUrl());
        record.setThermalImageThumbnailUrl(request.thermalImageThumbnailUrl());
        record.setAnomalyMarkersData(request.anomalyMarkersData());
        record.setInspectorName(request.inspectorName());
        
        if (request.transformerStatus() != null) {
            try {
                record.setTransformerStatus(MaintenanceRecord.TransformerStatus.valueOf(request.transformerStatus()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid status
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
    }

    private MaintenanceRecordResponse mapToResponse(MaintenanceRecord record) {
        // Fetch anomaly details from all thermal images in the inspection
        List<AnomalyDetailDTO> anomalyDetails = new ArrayList<>();
        Inspection inspection = record.getInspection();
        
        if (inspection != null && inspection.getThermalImages() != null) {
            for (ThermalImage thermalImage : inspection.getThermalImages()) {
                List<Annotation> annotations = annotationRepository.findByThermalImageIdAndNotDeleted(thermalImage.getId());
                
                for (Annotation annotation : annotations) {
                    anomalyDetails.add(new AnomalyDetailDTO(
                        annotation.getId(),
                        annotation.getDetectionId(),
                        annotation.getAnnotationType(),
                        annotation.getDetectionClass(),
                        annotation.getConfidence(),
                        annotation.getX(),
                        annotation.getY(),
                        annotation.getWidth(),
                        annotation.getHeight(),
                        annotation.getComments(),
                        annotation.getCreatedBy(),
                        annotation.getCreatedAt(),
                        annotation.getModifiedBy(),
                        annotation.getModifiedAt(),
                        thermalImage.getId()
                    ));
                }
            }
        }
        
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
            anomalyDetails, // Include the detailed anomaly list
            record.getInspectorName(),
            record.getTransformerStatus() != null ? record.getTransformerStatus().name() : null,
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

