package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.InspectionRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
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

    @Value("${file.upload-dir}")
    private String uploadDir;

    public List<ThermalImage> getAllThermalImages() {
        return thermalImageRepository.findAll();
    }

    public List<ThermalImage> getThermalImagesByInspectionId(UUID inspectionId) {
        return thermalImageRepository.findByInspectionId(inspectionId);
    }

    public ThermalImage saveThermalImage(UUID inspectionId, ThermalImage thermalImage, MultipartFile file) throws IOException {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));
        thermalImage.setInspection(inspection);
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());
        thermalImage.setImageUrl("/api/thermal-images/images/" + fileName);
        return thermalImageRepository.save(thermalImage);
    }

    public Resource loadImageAsResource(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found " + filename);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + filename, ex);
        }
    }
}
