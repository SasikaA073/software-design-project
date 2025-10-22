package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.FeedbackLog;
import com.example.transformermanagement.service.FeedbackLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * FR3.3: REST API for Feedback Log Management and Export
 * 
 * Provides endpoints to export feedback logs in JSON and CSV formats
 * for model improvement and training data preparation
 */
@RestController
@RequestMapping("/api/feedback-logs")
public class FeedbackLogController {

    @Autowired
    private FeedbackLogService feedbackLogService;

    /**
     * Get all feedback logs
     * GET /api/feedback-logs
     */
    @GetMapping
    public ResponseEntity<List<FeedbackLog>> getAllFeedbackLogs() {
        List<FeedbackLog> logs = feedbackLogService.getAllFeedbackLogs();
        return ResponseEntity.ok(logs);
    }

    /**
     * Get feedback logs for a specific thermal image
     * GET /api/feedback-logs/thermal-image/{thermalImageId}
     */
    @GetMapping("/thermal-image/{thermalImageId}")
    public ResponseEntity<List<FeedbackLog>> getFeedbackLogsByImage(@PathVariable UUID thermalImageId) {
        List<FeedbackLog> logs = feedbackLogService.getFeedbackLogsByImage(thermalImageId);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get unused feedback logs (not yet used for training)
     * GET /api/feedback-logs/unused
     */
    @GetMapping("/unused")
    public ResponseEntity<List<FeedbackLog>> getUnusedFeedbackLogs() {
        List<FeedbackLog> logs = feedbackLogService.getUnusedFeedbackLogs();
        return ResponseEntity.ok(logs);
    }

    /**
     * Export all feedback logs in JSON format
     * GET /api/feedback-logs/export/json
     */
    @GetMapping("/export/json")
    public ResponseEntity<String> exportAllAsJSON() {
        try {
            List<FeedbackLog> logs = feedbackLogService.getAllFeedbackLogs();
            String json = feedbackLogService.exportFeedbackLogsAsJSON(logs);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", 
                "feedback_logs_" + OffsetDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".json");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(json);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Export all feedback logs in CSV format
     * GET /api/feedback-logs/export/csv
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportAllAsCSV() {
        try {
            List<FeedbackLog> logs = feedbackLogService.getAllFeedbackLogs();
            String csv = feedbackLogService.exportFeedbackLogsAsCSV(logs);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", 
                "feedback_logs_" + OffsetDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".csv");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(csv);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error exporting CSV: " + e.getMessage());
        }
    }

    /**
     * Export unused feedback logs in JSON format
     * GET /api/feedback-logs/export/json/unused
     */
    @GetMapping("/export/json/unused")
    public ResponseEntity<String> exportUnusedAsJSON() {
        try {
            List<FeedbackLog> logs = feedbackLogService.getUnusedFeedbackLogs();
            String json = feedbackLogService.exportFeedbackLogsAsJSON(logs);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", 
                "feedback_logs_unused_" + OffsetDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".json");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(json);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Export unused feedback logs in CSV format
     * GET /api/feedback-logs/export/csv/unused
     */
    @GetMapping("/export/csv/unused")
    public ResponseEntity<String> exportUnusedAsCSV() {
        try {
            List<FeedbackLog> logs = feedbackLogService.getUnusedFeedbackLogs();
            String csv = feedbackLogService.exportFeedbackLogsAsCSV(logs);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", 
                "feedback_logs_unused_" + OffsetDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".csv");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(csv);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error exporting CSV: " + e.getMessage());
        }
    }

    /**
     * Export feedback logs for a specific thermal image in JSON format
     * GET /api/feedback-logs/export/json/thermal-image/{thermalImageId}
     */
    @GetMapping("/export/json/thermal-image/{thermalImageId}")
    public ResponseEntity<String> exportImageLogsAsJSON(@PathVariable UUID thermalImageId) {
        try {
            List<FeedbackLog> logs = feedbackLogService.getFeedbackLogsByImage(thermalImageId);
            String json = feedbackLogService.exportFeedbackLogsAsJSON(logs);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", 
                "feedback_logs_" + thermalImageId.toString() + ".json");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(json);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Mark feedback logs as used for training
     * POST /api/feedback-logs/mark-used
     * Body: ["uuid1", "uuid2", "uuid3"]
     */
    @PostMapping("/mark-used")
    public ResponseEntity<Map<String, Object>> markAsUsed(@RequestBody List<String> feedbackLogIds) {
        try {
            List<UUID> uuids = feedbackLogIds.stream()
                .map(UUID::fromString)
                .toList();
            
            feedbackLogService.markAsUsedForTraining(uuids);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Marked " + uuids.size() + " feedback logs as used for training");
            response.put("count", uuids.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get feedback log statistics
     * GET /api/feedback-logs/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getFeedbackLogStats() {
        try {
            List<FeedbackLog> allLogs = feedbackLogService.getAllFeedbackLogs();
            List<FeedbackLog> unusedLogs = feedbackLogService.getUnusedFeedbackLogs();
            
            Map<String, Long> feedbackTypeCounts = allLogs.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    FeedbackLog::getFeedbackType,
                    java.util.stream.Collectors.counting()
                ));
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalLogs", allLogs.size());
            stats.put("unusedLogs", unusedLogs.size());
            stats.put("usedLogs", allLogs.size() - unusedLogs.size());
            stats.put("feedbackTypeCounts", feedbackTypeCounts);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Manually create a feedback log entry
     * POST /api/feedback-logs/create
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createFeedbackLog(
            @RequestParam UUID thermalImageId,
            @RequestParam(required = false) UUID annotationId,
            @RequestBody Map<String, Object> feedbackData) {
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> aiPrediction = (Map<String, Object>) feedbackData.get("aiPrediction");
            
            @SuppressWarnings("unchecked")
            Map<String, Object> finalAnnotation = (Map<String, Object>) feedbackData.get("finalAnnotation");
            
            String feedbackType = (String) feedbackData.get("feedbackType");
            String annotatorId = (String) feedbackData.get("annotatorId");
            String annotatorName = (String) feedbackData.get("annotatorName");
            String comments = (String) feedbackData.get("comments");
            
            FeedbackLog log = feedbackLogService.createFeedbackLog(
                thermalImageId,
                annotationId,
                aiPrediction,
                finalAnnotation,
                feedbackType,
                annotatorId,
                annotatorName,
                comments
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("feedbackLogId", log.getId().toString());
            response.put("message", "Feedback log created successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
