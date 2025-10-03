package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.InspectionRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class ThermalImageService {

    @Autowired
    private ThermalImageRepository thermalImageRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public List<ThermalImage> getAllThermalImages() {
        return thermalImageRepository.findAll();
    }

    public List<ThermalImage> getThermalImagesByInspectionId(UUID inspectionId) {
        return thermalImageRepository.findByInspectionId(inspectionId);
    }

    public List<ThermalImage> getThermalImagesByInspectionIdAndType(UUID inspectionId, String imageType) {
        return thermalImageRepository.findByInspectionIdAndImageTypeIgnoreCase(inspectionId, imageType);
    }

    public ThermalImage saveThermalImage(UUID inspectionId, ThermalImage thermalImage, MultipartFile file) throws IOException {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));
        thermalImage.setInspection(inspection);

        String fileName = UUID.randomUUID() + "_" + (file.getOriginalFilename() == null ? "image" : file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_"));
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
        Path destination = root.resolve(fileName);
        Files.write(destination, file.getBytes());

        // Public URL served by WebConfig resource handler
        String imageUrl = "/uploads/" + fileName;
        thermalImage.setImageUrl(imageUrl);

        // Save the thermal image first
        ThermalImage savedImage = thermalImageRepository.save(thermalImage);

        // If this is a maintenance image, call anomaly detection API
        if ("Maintenance".equalsIgnoreCase(thermalImage.getImageType())) {
            try {
                System.out.println("\n🔍 Maintenance image detected - triggering anomaly detection...");
                JsonNode anomalyResponse = anomalyDetectionService.analyzeMaintenanceImageForAnomalies(imageUrl);
                System.out.println("✅ Anomaly detection completed successfully!");
                
                // Log the full response
                System.out.println("\n📊 Full Anomaly Detection Response:");
                System.out.println(anomalyResponse.toPrettyString());
                
                // Extract data from response structure: { "outputs": [ {...} ] }
                JsonNode resultData = null;
                
                if (anomalyResponse.has("outputs") && anomalyResponse.get("outputs").isArray()) {
                    JsonNode outputs = anomalyResponse.get("outputs");
                    if (outputs.size() > 0) {
                        resultData = outputs.get(0);
                        System.out.println("✓ Found outputs array, using first element");
                    }
                } else {
                    System.out.println("⚠️ 'outputs' array not found in response");
                    return savedImage;
                }
                
                if (resultData == null) {
                    System.out.println("⚠️ Could not extract result data from response");
                    return savedImage;
                }
                
                // Extract count_objects
                int countObjects = 0;
                if (resultData.has("count_objects")) {
                    countObjects = resultData.get("count_objects").asInt();
                    System.out.println("✓ Successfully extracted count_objects: " + countObjects);
                } else {
                    System.out.println("⚠️ count_objects field not found in outputs[0]");
                }
                
                System.out.println("\n========================================");
                System.out.println("📈 EXTRACTED DETECTION DATA");
                System.out.println("========================================");
                System.out.println("Total Objects Detected: " + countObjects);
                
                // Extract individual detections from predictions.predictions array
                JsonNode predictionsObj = resultData.has("predictions") ? resultData.get("predictions") : null;
                
                if (predictionsObj != null && predictionsObj.has("predictions")) {
                    JsonNode detectionsArray = predictionsObj.get("predictions");
                    
                    if (detectionsArray.isArray()) {
                        System.out.println("\n🎯 Individual Detections:");
                        System.out.println("------------------------------------------");
                        
                        int detectionIndex = 1;
                        for (JsonNode detection : detectionsArray) {
                            System.out.println("\nDetection #" + detectionIndex + ":");
                            
                            String detectionId = detection.has("detection_id") ? detection.get("detection_id").asText() : "N/A";
                            String className = detection.has("class") ? detection.get("class").asText() : "N/A";
                            double confidence = detection.has("confidence") ? detection.get("confidence").asDouble() : 0.0;
                            double x = detection.has("x") ? detection.get("x").asDouble() : 0.0;
                            double y = detection.has("y") ? detection.get("y").asDouble() : 0.0;
                            double width = detection.has("width") ? detection.get("width").asDouble() : 0.0;
                            double height = detection.has("height") ? detection.get("height").asDouble() : 0.0;
                            
                            System.out.println("  ├─ Detection ID: " + detectionId);
                            System.out.println("  ├─ Class: " + className);
                            System.out.println("  ├─ Confidence: " + String.format("%.2f%%", confidence * 100));
                            System.out.println("  ├─ Position: (x=" + x + ", y=" + y + ")");
                            System.out.println("  └─ Size: (width=" + width + ", height=" + height + ")");
                            
                            detectionIndex++;
                        }
                        
                        System.out.println("\n------------------------------------------");
                        System.out.println("Total detections processed: " + detectionsArray.size());
                        
                        // Store detection data as JSON string in the database
                        savedImage.setDetectionData(detectionsArray.toString());
                        savedImage = thermalImageRepository.save(savedImage);
                        System.out.println("✅ Detection data saved to database");
                    } else {
                        System.out.println("⚠️ predictions.predictions is not an array");
                    }
                } else {
                    System.out.println("⚠️ No predictions.predictions found in response");
                }
                
                System.out.println("========================================\n");

            } catch (Exception e) {
                // Log error but don't fail the upload
                System.err.println("❌ Failed to run anomaly detection: " + e.getMessage());
                e.printStackTrace();
            }
        }

        return savedImage;
    }

    public ThermalImage updateDetectionData(UUID thermalImageId, String detectionsJson) {
        return thermalImageRepository.findById(thermalImageId)
            .map(thermalImage -> {
                thermalImage.setDetectionData(detectionsJson);
                return thermalImageRepository.save(thermalImage);
            })
            .orElse(null);
    }
}
