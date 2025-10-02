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
                
                // Log the response (you can later store this in the database if needed)
                System.out.println("📊 Anomaly Detection Result:");
                System.out.println(anomalyResponse.toPrettyString());
                
            } catch (Exception e) {
                // Log error but don't fail the upload
                System.err.println("❌ Failed to run anomaly detection: " + e.getMessage());
                e.printStackTrace();
            }
        }

        return savedImage;
    }
}
