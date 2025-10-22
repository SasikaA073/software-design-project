package com.example.transformermanagement.controller;

import com.example.transformermanagement.service.RoboflowDatasetService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API for uploading annotated images to Roboflow for model retraining
 */
@RestController
@RequestMapping("/api/roboflow")
public class RoboflowDatasetController {

    @Autowired
    private RoboflowDatasetService roboflowDatasetService;

    /**
     * Upload a single thermal image with annotations to Roboflow
     * 
     * POST /api/roboflow/upload/{thermalImageId}?split=train
     */
    @PostMapping("/upload/{thermalImageId}")
    public ResponseEntity<Map<String, Object>> uploadSingleImage(
            @PathVariable UUID thermalImageId,
            @RequestParam(defaultValue = "train") String split) {
        
        try {
            JsonNode response = roboflowDatasetService.uploadImageWithAnnotations(thermalImageId, split);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("thermalImageId", thermalImageId.toString());
            result.put("split", split);
            result.put("roboflowResponse", response);
            result.put("message", "Image and annotations uploaded successfully to Roboflow");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Batch upload multiple thermal images with annotations
     * 
     * POST /api/roboflow/upload/batch?split=train
     * Body: ["uuid1", "uuid2", "uuid3"]
     */
    @PostMapping("/upload/batch")
    public ResponseEntity<Map<String, Object>> batchUploadImages(
            @RequestBody List<String> thermalImageIds,
            @RequestParam(defaultValue = "train") String split) {
        
        try {
            List<UUID> uuids = thermalImageIds.stream()
                .map(UUID::fromString)
                .toList();
            
            Map<String, Object> result = roboflowDatasetService.batchUploadImages(uuids, split);
            result.put("success", true);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Upload all user-edited/corrected annotations for retraining
     * This finds all images where users have made corrections and uploads them
     * 
     * POST /api/roboflow/upload/user-corrections?split=train
     */
    @PostMapping("/upload/user-corrections")
    public ResponseEntity<Map<String, Object>> uploadUserCorrections(
            @RequestParam(defaultValue = "train") String split) {
        
        try {
            Map<String, Object> result = roboflowDatasetService.uploadUserCorrectedAnnotations(split);
            result.put("success", true);
            result.put("message", "User-corrected annotations uploaded to Roboflow for retraining");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Export annotations in YOLO format
     * 
     * GET /api/roboflow/export/yolo/{thermalImageId}
     */
    @GetMapping("/export/yolo/{thermalImageId}")
    public ResponseEntity<Map<String, Object>> exportYOLO(@PathVariable UUID thermalImageId) {
        try {
            String yoloFormat = roboflowDatasetService.exportToYOLOFormat(thermalImageId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("thermalImageId", thermalImageId.toString());
            result.put("yoloAnnotations", yoloFormat);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Trigger model training on Roboflow
     * 
     * POST /api/roboflow/train?version=2
     */
    @PostMapping("/train")
    public ResponseEntity<Map<String, Object>> triggerTraining(
            @RequestParam(required = false) String version) {
        
        try {
            JsonNode response = roboflowDatasetService.triggerModelTraining(version);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Model training triggered successfully");
            result.put("roboflowResponse", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}

