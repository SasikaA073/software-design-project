package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Transformer;
import com.example.transformermanagement.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TransformerService {
    @Autowired
    private TransformerRepository transformerRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public List<Transformer> getAllTransformers() {
        return transformerRepository.findAll();
    }

    public Optional<Transformer> getTransformerById(java.util.UUID id) {
        return transformerRepository.findById(id);
    }

    public Transformer saveTransformer(Transformer transformer) {
        return transformerRepository.save(transformer);
    }

    public void deleteTransformer(java.util.UUID id) {
        transformerRepository.deleteById(id);
    }

    public Transformer uploadBaselineImage(java.util.UUID transformerId, String weatherCondition, MultipartFile file) throws IOException {
        System.out.println("\n========================================");
        System.out.println("UPLOADING BASELINE IMAGE");
        System.out.println("Transformer ID: " + transformerId);
        System.out.println("Weather Condition: " + weatherCondition);
        System.out.println("File name: " + file.getOriginalFilename());
        System.out.println("File size: " + file.getSize() + " bytes");
        System.out.println("========================================\n");
        
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerId);
        if (transformerOpt.isEmpty()) {
            System.err.println("ERROR: Transformer not found with ID: " + transformerId);
            throw new RuntimeException("Transformer not found");
        }

        Transformer transformer = transformerOpt.get();
        System.out.println("Found transformer: " + transformer.getTransformerNo());
        
        // Create filename with transformer ID and weather condition
        String fileName = UUID.randomUUID() + "_" + transformerId + "_baseline_" + weatherCondition.toLowerCase() + ".jpg";
        Path filePath = Paths.get(uploadDir, fileName);
        
        System.out.println("Saving file to: " + filePath.toString());
        
        // Ensure upload directory exists
        Files.createDirectories(filePath.getParent());
        
        // Save the file
        Files.write(filePath, file.getBytes());
        System.out.println("✅ File saved successfully!");
        
        // Store the URL in the appropriate field based on weather condition
        String imageUrl = "/uploads/" + fileName;
        System.out.println("Image URL: " + imageUrl);
        
        switch (weatherCondition.toLowerCase()) {
            case "sunny":
                transformer.setSunnyBaselineImageUrl(imageUrl);
                System.out.println("Set sunny baseline image URL");
                break;
            case "cloudy":
                transformer.setCloudyBaselineImageUrl(imageUrl);
                System.out.println("Set cloudy baseline image URL");
                break;
            case "rainy":
                transformer.setRainyBaselineImageUrl(imageUrl);
                System.out.println("Set rainy baseline image URL");
                break;
            default:
                System.err.println("ERROR: Invalid weather condition: " + weatherCondition);
                throw new IllegalArgumentException("Invalid weather condition: " + weatherCondition);
        }
        
        Transformer savedTransformer = transformerRepository.save(transformer);
        System.out.println("✅ Transformer saved to database!");
        System.out.println("  - Sunny URL: " + savedTransformer.getSunnyBaselineImageUrl());
        System.out.println("  - Cloudy URL: " + savedTransformer.getCloudyBaselineImageUrl());
        System.out.println("  - Rainy URL: " + savedTransformer.getRainyBaselineImageUrl());
        System.out.println("========================================\n");
        
        return savedTransformer;
    }

    public String getBaselineImageUrl(java.util.UUID transformerId, String weatherCondition) {
        System.out.println("\n=== GET BASELINE IMAGE URL ===");
        System.out.println("Transformer ID: " + transformerId);
        System.out.println("Weather Condition: " + weatherCondition);
        
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerId);
        if (transformerOpt.isEmpty()) {
            System.out.println("ERROR: Transformer not found!");
            return null;
        }

        Transformer transformer = transformerOpt.get();
        System.out.println("Transformer found: " + transformer.getTransformerNo());
        System.out.println("  - Sunny baseline: " + transformer.getSunnyBaselineImageUrl());
        System.out.println("  - Cloudy baseline: " + transformer.getCloudyBaselineImageUrl());
        System.out.println("  - Rainy baseline: " + transformer.getRainyBaselineImageUrl());
        
        String imageUrl = null;
        switch (weatherCondition.toLowerCase()) {
            case "sunny":
                imageUrl = transformer.getSunnyBaselineImageUrl();
                break;
            case "cloudy":
                imageUrl = transformer.getCloudyBaselineImageUrl();
                break;
            case "rainy":
                imageUrl = transformer.getRainyBaselineImageUrl();
                break;
            default:
                System.out.println("ERROR: Invalid weather condition: " + weatherCondition);
                return null;
        }
        
        System.out.println("Returning image URL: " + imageUrl);
        System.out.println("=== END ===\n");
        return imageUrl;
    }
}
