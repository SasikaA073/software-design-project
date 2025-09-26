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
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerId);
        if (transformerOpt.isEmpty()) {
            throw new RuntimeException("Transformer not found");
        }

        Transformer transformer = transformerOpt.get();
        
        // Create filename with transformer ID and weather condition
        String fileName = UUID.randomUUID() + "_" + transformerId + "_baseline_" + weatherCondition.toLowerCase() + ".jpg";
        Path filePath = Paths.get(uploadDir, fileName);
        
        // Ensure upload directory exists
        Files.createDirectories(filePath.getParent());
        
        // Save the file
        Files.write(filePath, file.getBytes());
        
        // Store the URL in the appropriate field based on weather condition
        String imageUrl = "/uploads/" + fileName;
        switch (weatherCondition.toLowerCase()) {
            case "sunny":
                transformer.setSunnyBaselineImageUrl(imageUrl);
                break;
            case "cloudy":
                transformer.setCloudyBaselineImageUrl(imageUrl);
                break;
            case "rainy":
                transformer.setRainyBaselineImageUrl(imageUrl);
                break;
            default:
                throw new IllegalArgumentException("Invalid weather condition: " + weatherCondition);
        }
        
        return transformerRepository.save(transformer);
    }

    public String getBaselineImageUrl(java.util.UUID transformerId, String weatherCondition) {
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerId);
        if (transformerOpt.isEmpty()) {
            return null;
        }

        Transformer transformer = transformerOpt.get();
        switch (weatherCondition.toLowerCase()) {
            case "sunny":
                return transformer.getSunnyBaselineImageUrl();
            case "cloudy":
                return transformer.getCloudyBaselineImageUrl();
            case "rainy":
                return transformer.getRainyBaselineImageUrl();
            default:
                return null;
        }
    }
}
