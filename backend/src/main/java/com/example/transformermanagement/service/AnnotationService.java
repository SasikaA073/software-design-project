package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Annotation;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.AnnotationRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AnnotationService {

    @Autowired
    private AnnotationRepository annotationRepository;

    @Autowired
    private ThermalImageRepository thermalImageRepository;

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

    @Transactional
    public List<Annotation> syncAnnotations(UUID thermalImageId, List<Annotation> annotations, String userId) {
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found"));

        // Get existing annotations
        List<Annotation> existingAnnotations = annotationRepository.findByThermalImageId(thermalImageId);

        // Delete all existing annotations (we'll recreate them)
        annotationRepository.deleteAll(existingAnnotations);

        // Create new annotations
        for (Annotation annotation : annotations) {
            annotation.setId(null); // Ensure new ID is generated
            annotation.setThermalImage(thermalImage);
            
            if (annotation.getCreatedBy() == null) {
                annotation.setCreatedBy(userId != null ? userId : "system");
            }
            if (annotation.getModifiedBy() == null) {
                annotation.setModifiedBy(userId != null ? userId : "system");
            }
            
            annotationRepository.save(annotation);
        }

        return annotationRepository.findByThermalImageIdAndNotDeleted(thermalImageId);
    }
}

