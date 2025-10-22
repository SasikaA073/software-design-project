package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Annotation;
import com.example.transformermanagement.model.FeedbackLog;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.AnnotationRepository;
import com.example.transformermanagement.repository.FeedbackLogRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * FR3.3: Service for managing feedback logs and exporting for model improvement
 */
@Service
public class FeedbackLogService {
    
    private static final Logger logger = LoggerFactory.getLogger(FeedbackLogService.class);
    
    @Autowired
    private FeedbackLogRepository feedbackLogRepository;
    
    @Autowired
    private AnnotationRepository annotationRepository;
    
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Create a feedback log entry when an annotation is modified
     */
    @Transactional
    public FeedbackLog createFeedbackLog(
            UUID thermalImageId,
            UUID annotationId,
            Map<String, Object> aiPrediction,
            Map<String, Object> finalAnnotation,
            String feedbackType,
            String annotatorId,
            String annotatorName,
            String comments) throws IOException {
        
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found"));
        
        Annotation annotation = null;
        if (annotationId != null) {
            annotation = annotationRepository.findById(annotationId).orElse(null);
        }
        
        FeedbackLog feedbackLog = new FeedbackLog();
        feedbackLog.setThermalImage(thermalImage);
        feedbackLog.setAnnotation(annotation);
        feedbackLog.setAiPrediction(objectMapper.writeValueAsString(aiPrediction));
        feedbackLog.setFinalAnnotation(objectMapper.writeValueAsString(finalAnnotation));
        feedbackLog.setFeedbackType(feedbackType);
        feedbackLog.setAnnotatorId(annotatorId != null ? annotatorId : "system");
        feedbackLog.setAnnotatorName(annotatorName != null ? annotatorName : "System User");
        feedbackLog.setAnnotatorRole("inspector");
        feedbackLog.setComments(comments);
        feedbackLog.setUsedForTraining(false);
        
        FeedbackLog saved = feedbackLogRepository.save(feedbackLog);
        logger.info("Created feedback log entry for thermal image {} with type {}", thermalImageId, feedbackType);
        
        return saved;
    }
    
    /**
     * Automatically create feedback logs when annotations are synced
     * Compares AI predictions with final user annotations
     */
    @Transactional
    public void createFeedbackLogsFromSync(UUID thermalImageId, String userId) {
        try {
            ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
                .orElseThrow(() -> new RuntimeException("Thermal image not found"));
            
            // Get all annotations for this image
            List<Annotation> annotations = annotationRepository.findByThermalImageId(thermalImageId);
            
            // Separate AI-detected and user-modified annotations
            List<Annotation> aiAnnotations = annotations.stream()
                .filter(a -> "ai_detected".equals(a.getAnnotationType()))
                .collect(Collectors.toList());
            
            List<Annotation> userAnnotations = annotations.stream()
                .filter(a -> "user_added".equals(a.getAnnotationType()) || 
                            "user_edited".equals(a.getAnnotationType()) ||
                            "user_deleted".equals(a.getAnnotationType()))
                .collect(Collectors.toList());
            
            // Create feedback logs for each user modification
            for (Annotation userAnnotation : userAnnotations) {
                Map<String, Object> aiPrediction = new HashMap<>();
                Map<String, Object> finalAnnotation = convertAnnotationToMap(userAnnotation);
                
                String feedbackType = switch (userAnnotation.getAnnotationType()) {
                    case "user_added" -> "addition";
                    case "user_edited" -> "correction";
                    case "user_deleted" -> "deletion";
                    default -> "no_change";
                };
                
                // Try to find corresponding AI prediction
                Optional<Annotation> matchingAI = aiAnnotations.stream()
                    .filter(ai -> ai.getDetectionId().equals(userAnnotation.getDetectionId()))
                    .findFirst();
                
                if (matchingAI.isPresent()) {
                    aiPrediction = convertAnnotationToMap(matchingAI.get());
                } else {
                    aiPrediction.put("exists", false);
                    aiPrediction.put("note", "User added new detection not found by AI");
                }
                
                createFeedbackLog(
                    thermalImageId,
                    userAnnotation.getId(),
                    aiPrediction,
                    finalAnnotation,
                    feedbackType,
                    userAnnotation.getModifiedBy(),
                    userAnnotation.getModifiedBy(),
                    userAnnotation.getComments()
                );
            }
            
            logger.info("Created {} feedback log entries for thermal image {}", userAnnotations.size(), thermalImageId);
            
        } catch (Exception e) {
            logger.error("Error creating feedback logs: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Export feedback logs in JSON format
     */
    public String exportFeedbackLogsAsJSON(List<FeedbackLog> feedbackLogs) throws IOException {
        List<Map<String, Object>> exportData = new ArrayList<>();
        
        for (FeedbackLog log : feedbackLogs) {
            Map<String, Object> entry = new HashMap<>();
            
            // Image ID
            entry.put("imageId", log.getThermalImage().getId().toString());
            entry.put("imageUrl", log.getThermalImage().getImageUrl());
            entry.put("imageType", log.getThermalImage().getImageType());
            
            // AI Prediction
            if (log.getAiPrediction() != null) {
                entry.put("modelPredictedAnomalies", objectMapper.readValue(log.getAiPrediction(), Map.class));
            } else {
                entry.put("modelPredictedAnomalies", null);
            }
            
            // Final Annotation
            if (log.getFinalAnnotation() != null) {
                entry.put("finalAcceptedAnnotations", objectMapper.readValue(log.getFinalAnnotation(), Map.class));
            } else {
                entry.put("finalAcceptedAnnotations", null);
            }
            
            // Annotator Metadata
            Map<String, String> annotatorMetadata = new HashMap<>();
            annotatorMetadata.put("annotatorId", log.getAnnotatorId());
            annotatorMetadata.put("annotatorName", log.getAnnotatorName());
            annotatorMetadata.put("annotatorRole", log.getAnnotatorRole());
            annotatorMetadata.put("timestamp", log.getCreatedAt().toString());
            entry.put("annotatorMetadata", annotatorMetadata);
            
            // Feedback Type
            entry.put("feedbackType", log.getFeedbackType());
            entry.put("comments", log.getComments());
            entry.put("usedForTraining", log.getUsedForTraining());
            
            exportData.add(entry);
        }
        
        // Mark as exported
        for (FeedbackLog log : feedbackLogs) {
            log.setExportedAt(OffsetDateTime.now());
            feedbackLogRepository.save(log);
        }
        
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(exportData);
    }
    
    /**
     * Export feedback logs in CSV format
     */
    public String exportFeedbackLogsAsCSV(List<FeedbackLog> feedbackLogs) throws IOException {
        StringBuilder csv = new StringBuilder();
        
        // CSV Header
        csv.append("Image ID,Image URL,Image Type,");
        csv.append("AI Detection ID,AI Class,AI Confidence,AI X,AI Y,AI Width,AI Height,");
        csv.append("Final Detection ID,Final Class,Final Confidence,Final X,Final Y,Final Width,Final Height,");
        csv.append("Feedback Type,Annotator ID,Annotator Name,Annotator Role,");
        csv.append("Timestamp,Comments,Used For Training\n");
        
        // CSV Rows
        for (FeedbackLog log : feedbackLogs) {
            Map<String, Object> aiPrediction = null;
            Map<String, Object> finalAnnotation = null;
            
            try {
                if (log.getAiPrediction() != null) {
                    aiPrediction = objectMapper.readValue(log.getAiPrediction(), Map.class);
                }
                if (log.getFinalAnnotation() != null) {
                    finalAnnotation = objectMapper.readValue(log.getFinalAnnotation(), Map.class);
                }
            } catch (IOException e) {
                logger.error("Error parsing annotation data", e);
            }
            
            // Image data
            csv.append(escapeCSV(log.getThermalImage().getId().toString())).append(",");
            csv.append(escapeCSV(log.getThermalImage().getImageUrl())).append(",");
            csv.append(escapeCSV(log.getThermalImage().getImageType())).append(",");
            
            // AI prediction data
            if (aiPrediction != null) {
                csv.append(escapeCSV(getString(aiPrediction, "detectionId"))).append(",");
                csv.append(escapeCSV(getString(aiPrediction, "detectionClass"))).append(",");
                csv.append(escapeCSV(getString(aiPrediction, "confidence"))).append(",");
                csv.append(escapeCSV(getString(aiPrediction, "x"))).append(",");
                csv.append(escapeCSV(getString(aiPrediction, "y"))).append(",");
                csv.append(escapeCSV(getString(aiPrediction, "width"))).append(",");
                csv.append(escapeCSV(getString(aiPrediction, "height"))).append(",");
            } else {
                csv.append(",,,,,,");
            }
            
            // Final annotation data
            if (finalAnnotation != null) {
                csv.append(escapeCSV(getString(finalAnnotation, "detectionId"))).append(",");
                csv.append(escapeCSV(getString(finalAnnotation, "detectionClass"))).append(",");
                csv.append(escapeCSV(getString(finalAnnotation, "confidence"))).append(",");
                csv.append(escapeCSV(getString(finalAnnotation, "x"))).append(",");
                csv.append(escapeCSV(getString(finalAnnotation, "y"))).append(",");
                csv.append(escapeCSV(getString(finalAnnotation, "width"))).append(",");
                csv.append(escapeCSV(getString(finalAnnotation, "height"))).append(",");
            } else {
                csv.append(",,,,,,");
            }
            
            // Metadata
            csv.append(escapeCSV(log.getFeedbackType())).append(",");
            csv.append(escapeCSV(log.getAnnotatorId())).append(",");
            csv.append(escapeCSV(log.getAnnotatorName())).append(",");
            csv.append(escapeCSV(log.getAnnotatorRole())).append(",");
            csv.append(escapeCSV(log.getCreatedAt().toString())).append(",");
            csv.append(escapeCSV(log.getComments())).append(",");
            csv.append(log.getUsedForTraining()).append("\n");
        }
        
        // Mark as exported
        for (FeedbackLog log : feedbackLogs) {
            log.setExportedAt(OffsetDateTime.now());
            feedbackLogRepository.save(log);
        }
        
        return csv.toString();
    }
    
    /**
     * Get all feedback logs
     */
    public List<FeedbackLog> getAllFeedbackLogs() {
        return feedbackLogRepository.findAll();
    }
    
    /**
     * Get feedback logs by thermal image
     */
    public List<FeedbackLog> getFeedbackLogsByImage(UUID thermalImageId) {
        return feedbackLogRepository.findByThermalImageId(thermalImageId);
    }
    
    /**
     * Get unused feedback logs (not yet used for training)
     */
    public List<FeedbackLog> getUnusedFeedbackLogs() {
        return feedbackLogRepository.findUnusedForTraining();
    }
    
    /**
     * Mark feedback logs as used for training
     */
    @Transactional
    public void markAsUsedForTraining(List<UUID> feedbackLogIds) {
        for (UUID id : feedbackLogIds) {
            FeedbackLog log = feedbackLogRepository.findById(id).orElse(null);
            if (log != null) {
                log.setUsedForTraining(true);
                feedbackLogRepository.save(log);
            }
        }
        logger.info("Marked {} feedback logs as used for training", feedbackLogIds.size());
    }
    
    // Helper methods
    private Map<String, Object> convertAnnotationToMap(Annotation annotation) {
        Map<String, Object> map = new HashMap<>();
        map.put("detectionId", annotation.getDetectionId());
        map.put("detectionClass", annotation.getDetectionClass());
        map.put("confidence", annotation.getConfidence());
        map.put("x", annotation.getX());
        map.put("y", annotation.getY());
        map.put("width", annotation.getWidth());
        map.put("height", annotation.getHeight());
        map.put("annotationType", annotation.getAnnotationType());
        map.put("comments", annotation.getComments());
        map.put("createdBy", annotation.getCreatedBy());
        map.put("createdAt", annotation.getCreatedAt().toString());
        map.put("modifiedBy", annotation.getModifiedBy());
        map.put("modifiedAt", annotation.getModifiedAt().toString());
        return map;
    }
    
    private String escapeCSV(String value) {
        if (value == null) return "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
    
    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : "";
    }
}
