package com.example.transformermanagement.controller;

import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.service.ThermalImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/thermal-images")
public class ThermalImageController {

    @Autowired
    private ThermalImageService thermalImageService;

    @GetMapping
    public List<ThermalImage> getAllThermalImages(@RequestParam(required = false) UUID inspectionId,
                                                  @RequestParam(required = false) String imageType) {
        if (inspectionId != null && imageType != null && !imageType.isBlank()) {
            return thermalImageService.getThermalImagesByInspectionIdAndType(inspectionId, imageType);
        } else if (inspectionId != null) {
            return thermalImageService.getThermalImagesByInspectionId(inspectionId);
        }
        return thermalImageService.getAllThermalImages();
    }

    @PostMapping("/upload")
    public ThermalImage uploadImage(@RequestParam("inspectionId") UUID inspectionId,
                                    @RequestPart("image") ThermalImage thermalImage,
                                    @RequestPart("file") MultipartFile file) throws IOException {
        if (thermalImage.getImageType() == null || thermalImage.getImageType().isBlank()) {
            throw new IllegalArgumentException("imageType is required (Baseline or Maintenance)");
        }
        return thermalImageService.saveThermalImage(inspectionId, thermalImage, file);
    }

    @PutMapping("/{id}/detections")
    public ResponseEntity<ThermalImage> updateDetections(@PathVariable UUID id,
                                                         @RequestBody String detectionsJson) {
        ThermalImage updated = thermalImageService.updateDetectionData(id, detectionsJson);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
