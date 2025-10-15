package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.Annotation;
import com.example.transformermanagement.service.AnnotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/annotations")
public class AnnotationController {

    @Autowired
    private AnnotationService annotationService;

    @GetMapping("/thermal-image/{thermalImageId}")
    public ResponseEntity<List<Annotation>> getAnnotations(
            @PathVariable UUID thermalImageId,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        List<Annotation> annotations = annotationService.getAnnotationsByThermalImageId(thermalImageId, includeDeleted);
        return ResponseEntity.ok(annotations);
    }

    @PostMapping("/thermal-image/{thermalImageId}")
    public ResponseEntity<Annotation> createAnnotation(
            @PathVariable UUID thermalImageId,
            @RequestBody Annotation annotation,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        Annotation created = annotationService.createAnnotation(thermalImageId, annotation, userId);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{annotationId}")
    public ResponseEntity<Annotation> updateAnnotation(
            @PathVariable UUID annotationId,
            @RequestBody Annotation annotation,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        Annotation updated = annotationService.updateAnnotation(annotationId, annotation, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{annotationId}")
    public ResponseEntity<Void> deleteAnnotation(
            @PathVariable UUID annotationId,
            @RequestParam(defaultValue = "false") boolean hardDelete,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        annotationService.deleteAnnotation(annotationId, userId, hardDelete);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/thermal-image/{thermalImageId}/sync")
    public ResponseEntity<List<Annotation>> syncAnnotations(
            @PathVariable UUID thermalImageId,
            @RequestBody List<Annotation> annotations,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        List<Annotation> synced = annotationService.syncAnnotations(thermalImageId, annotations, userId);
        return ResponseEntity.ok(synced);
    }
}

