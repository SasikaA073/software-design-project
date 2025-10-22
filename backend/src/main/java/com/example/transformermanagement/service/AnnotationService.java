package com.example.transformermanagement.service;

import com.example.transformermanagement.dto.DetectionDTO;
import com.example.transformermanagement.model.Annotation;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.AnnotationRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AnnotationService {

    private static final Logger logger = LoggerFactory.getLogger(AnnotationService.class);

    @Autowired
    private AnnotationRepository annotationRepository;

    @Autowired
    private ThermalImageRepository thermalImageRepository;

    @Autowired
    private FeedbackLogService feedbackLogService;

    public List<Annotation> getAnnotationsByThermalImageId(UUID thermalImageId, boolean includeDeleted) {
        if (includeDeleted) {
            return annotationRepository.findByThermalImageId(thermalImageId);
        }
        return annotationRepository.findByThermalImageIdAndNotDeleted(thermalImageId);
    }

    @Transactional
    public Annotation createAnnotation(UUID thermalImageId, Annotation annotation, String userId) {
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found"));
        
        annotation.setThermalImage(thermalImage);
        annotation.setCreatedBy(userId != null ? userId : "system");
        annotation.setModifiedBy(userId != null ? userId : "system");
        
        // FR3.2: Store transformer ID
        if (thermalImage.getInspection() != null && thermalImage.getInspection().getTransformer() != null) {
            annotation.setTransformerId(thermalImage.getInspection().getTransformer().getId());
        }
        
        return annotationRepository.save(annotation);
    }

    @Transactional
    public Annotation updateAnnotation(UUID annotationId, Annotation updatedAnnotation, String userId) {
        Annotation existing = annotationRepository.findById(annotationId)
            .orElseThrow(() -> new RuntimeException("Annotation not found"));
        
        // Update fields
        existing.setDetectionClass(updatedAnnotation.getDetectionClass());
        existing.setConfidence(updatedAnnotation.getConfidence());
        existing.setX(updatedAnnotation.getX());
        existing.setY(updatedAnnotation.getY());
        existing.setWidth(updatedAnnotation.getWidth());
        existing.setHeight(updatedAnnotation.getHeight());
        
        if (updatedAnnotation.getComments() != null) {
            existing.setComments(updatedAnnotation.getComments());
        }
        
        existing.setAnnotationType("user_edited");
        existing.setModifiedBy(userId != null ? userId : "system");
        existing.setModifiedAt(OffsetDateTime.now());
        
        return annotationRepository.save(existing);
    }

    @Transactional
    public void deleteAnnotation(UUID annotationId, String userId, boolean hardDelete) {
        if (hardDelete) {
            annotationRepository.deleteById(annotationId);
        } else {
            // Soft delete
            Annotation annotation = annotationRepository.findById(annotationId)
                .orElseThrow(() -> new RuntimeException("Annotation not found"));
            
            annotation.setIsDeleted(true);
            annotation.setAnnotationType("user_deleted");
            annotation.setModifiedBy(userId != null ? userId : "system");
            annotation.setModifiedAt(OffsetDateTime.now());
            
            annotationRepository.save(annotation);
        }
    }

    // Removed old syncAnnotations method that used deleteAll - dangerous with foreign keys
    // Use syncAnnotationsFromDTO instead, which preserves existing annotations

    /**
     * Sync annotations from frontend DetectionDTO format
     * Converts DTOs to Annotation entities and saves them
     * FR3.3: Also creates feedback logs for model improvement
     * 
     * Updated to preserve existing annotations instead of deleting them
     * to avoid foreign key constraint violations with feedback_logs
     */
    @Transactional
    public List<Annotation> syncAnnotationsFromDTO(UUID thermalImageId, List<DetectionDTO> detectionDTOs, String userId) {
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found"));

        // Get existing annotations
        List<Annotation> existingAnnotations = annotationRepository.findByThermalImageId(thermalImageId);

        // Instead of deleting, we'll update existing annotations or create new ones
        // This prevents foreign key constraint violations with feedback_logs

        // Get transformer ID for FR3.2
        UUID transformerId = null;
        if (thermalImage.getInspection() != null && thermalImage.getInspection().getTransformer() != null) {
            transformerId = thermalImage.getInspection().getTransformer().getId();
        }

        // Build a map of detection_id to existing annotations for quick lookup
        java.util.Map<String, Annotation> existingByDetectionId = existingAnnotations.stream()
            .collect(java.util.stream.Collectors.toMap(Annotation::getDetectionId, a -> a, (a1, a2) -> a1));

        // Track which detection IDs are in the new data
        java.util.Set<String> newDetectionIds = new java.util.HashSet<>();
        
        // Convert DTOs to Annotation entities and save
        List<Annotation> savedAnnotations = new ArrayList<>();
        
        for (DetectionDTO dto : detectionDTOs) {
            String detectionId = dto.getDetectionId() != null ? dto.getDetectionId() : "det_" + System.currentTimeMillis();
            newDetectionIds.add(detectionId);
            
            // Check if annotation already exists
            Annotation annotation = existingByDetectionId.get(detectionId);
            
            if (annotation == null) {
                // Create new annotation
                annotation = new Annotation();
                annotation.setThermalImage(thermalImage);
                annotation.setTransformerId(transformerId);
                annotation.setDetectionId(detectionId);
                annotation.setCreatedBy(dto.getCreatedBy() != null ? dto.getCreatedBy() : userId);
            }
            
            // Update annotation fields
            annotation.setDetectionClass(dto.getDetectionClass() != null ? dto.getDetectionClass() : "unknown");
            annotation.setConfidence(dto.getConfidence() != null ? dto.getConfidence() : 0.0);
            annotation.setX(dto.getX() != null ? dto.getX() : 0.0);
            annotation.setY(dto.getY() != null ? dto.getY() : 0.0);
            annotation.setWidth(dto.getWidth() != null ? dto.getWidth() : 0.0);
            annotation.setHeight(dto.getHeight() != null ? dto.getHeight() : 0.0);
            annotation.setAnnotationType(dto.getAnnotationType() != null ? dto.getAnnotationType() : "ai_detected");
            annotation.setComments(dto.getComments());
            annotation.setModifiedBy(dto.getModifiedBy() != null ? dto.getModifiedBy() : userId);
            annotation.setModifiedAt(OffsetDateTime.now());
            annotation.setIsDeleted(false);
            
            savedAnnotations.add(annotationRepository.save(annotation));
        }

        // Soft-delete annotations that are no longer in the new data
        for (Annotation existing : existingAnnotations) {
            if (!newDetectionIds.contains(existing.getDetectionId()) && !existing.getIsDeleted()) {
                existing.setIsDeleted(true);
                existing.setAnnotationType("user_deleted");
                existing.setModifiedBy(userId);
                existing.setModifiedAt(OffsetDateTime.now());
                annotationRepository.save(existing);
            }
        }

        // FR3.3: Create feedback logs for user modifications
        try {
            if (feedbackLogService != null) {
                feedbackLogService.createFeedbackLogsFromSync(thermalImageId, userId);
                System.out.println("✅ FR3.3: Feedback logs created successfully for image: " + thermalImageId);
            }
            System.out.println("🎉 Sync completed successfully. Saved " + savedAnnotations.size() + " annotations");
        } catch (Exception e) {
            System.err.println("❌ FR3.3: Failed to create feedback logs: " + e.getMessage());
            e.printStackTrace();
            // Don't fail the entire sync if feedback log creation fails
            System.out.println("🎉 Sync completed successfully. Saved " + savedAnnotations.size() + " annotations");
        }

        return savedAnnotations;
    }

    /**
     * Convert Annotation entities to DetectionDTO for frontend
     */
    public List<DetectionDTO> convertAnnotationsToDTO(List<Annotation> annotations) {
        return annotations.stream().map(annotation -> {
            DetectionDTO dto = new DetectionDTO();
            dto.setDetectionId(annotation.getDetectionId());
            dto.setDetectionClass(annotation.getDetectionClass());
            dto.setConfidence(annotation.getConfidence());
            dto.setX(annotation.getX());
            dto.setY(annotation.getY());
            dto.setWidth(annotation.getWidth());
            dto.setHeight(annotation.getHeight());
            dto.setAnnotationType(annotation.getAnnotationType());
            dto.setComments(annotation.getComments());
            dto.setCreatedAt(annotation.getCreatedAt() != null ? annotation.getCreatedAt().toString() : null);
            dto.setCreatedBy(annotation.getCreatedBy());
            dto.setModifiedAt(annotation.getModifiedAt() != null ? annotation.getModifiedAt().toString() : null);
            dto.setModifiedBy(annotation.getModifiedBy());
            return dto;
        }).collect(Collectors.toList());
    }
}

