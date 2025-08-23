package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Inspection;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.InspectionRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URL;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ThermalImageService {

    @Autowired
    private ThermalImageRepository thermalImageRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    public ThermalImageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

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

        String original = file.getOriginalFilename();
        String sanitized = (original == null ? "image" : original).replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = "thermal-images/" + Instant.now().toEpochMilli() + "_" + UUID.randomUUID() + "_" + sanitized;

        PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putReq, RequestBody.fromBytes(file.getBytes()));

        URL fileUrl = s3Client.utilities().getUrl(GetUrlRequest.builder().bucket(bucketName).key(key).build());
        thermalImage.setImageUrl(fileUrl.toString());

        return thermalImageRepository.save(thermalImage);
    }
}
