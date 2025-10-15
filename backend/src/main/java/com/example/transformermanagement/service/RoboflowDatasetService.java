package com.example.transformermanagement.service;

import com.example.transformermanagement.model.Annotation;
import com.example.transformermanagement.model.ThermalImage;
import com.example.transformermanagement.repository.AnnotationRepository;
import com.example.transformermanagement.repository.ThermalImageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for uploading annotated images to Roboflow for model retraining
 */
@Service
public class RoboflowDatasetService {

    private static final Logger logger = LoggerFactory.getLogger(RoboflowDatasetService.class);
    
    // Roboflow Upload API configuration
    private static final String ROBOFLOW_UPLOAD_URL = "https://api.roboflow.com/dataset/{workspace}/{project}/upload";
    private static final String ROBOFLOW_API_KEY = "xLuuGmq6EfcX0kVtqEnA";
    private static final String WORKSPACE_ID = "isiriw"; // Extract from your workflow URL
    private static final String PROJECT_ID = "detect-count-and-visualize"; // Your project ID
    
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    
    @Autowired
    private AnnotationRepository annotationRepository;
    
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public RoboflowDatasetService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Upload a single thermal image with its corrected annotations to Roboflow
     * 
     * @param thermalImageId The ID of the thermal image to upload
     * @param split Dataset split: "train", "valid", or "test" (default: "train")
     * @return Response from Roboflow API
     */
    public JsonNode uploadImageWithAnnotations(UUID thermalImageId, String split) throws IOException, InterruptedException {
        logger.info("Starting upload to Roboflow for thermal image: {}", thermalImageId);
        
        // Get thermal image
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found: " + thermalImageId));
        
        // Get all non-deleted annotations for this image
        List<Annotation> annotations = annotationRepository.findByThermalImageIdAndNotDeleted(thermalImageId);
        
        if (annotations.isEmpty()) {
            logger.warn("No annotations found for thermal image: {}", thermalImageId);
            throw new RuntimeException("Cannot upload image without annotations");
        }
        
        logger.info("Found {} annotations for upload", annotations.size());
        
        // Read image file
        String fileName = thermalImage.getImageUrl().substring(thermalImage.getImageUrl().lastIndexOf('/') + 1);
        Path imagePath = Paths.get(uploadDir, fileName);
        
        if (!Files.exists(imagePath)) {
            throw new RuntimeException("Image file not found: " + imagePath);
        }
        
        // Convert image to base64
        byte[] imageBytes = Files.readAllBytes(imagePath);
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        
        // Get image dimensions (you might want to use ImageIO to get actual dimensions)
        // For now, we'll use the bounding box data to infer dimensions
        double maxX = annotations.stream().mapToDouble(a -> a.getX() + a.getWidth()).max().orElse(1024.0);
        double maxY = annotations.stream().mapToDouble(a -> a.getY() + a.getHeight()).max().orElse(768.0);
        int imageWidth = (int) Math.ceil(maxX);
        int imageHeight = (int) Math.ceil(maxY);
        
        // Build Roboflow annotation format
        ObjectNode roboflowAnnotation = buildRoboflowAnnotation(annotations, imageWidth, imageHeight, fileName);
        
        // Upload to Roboflow
        return uploadToRoboflow(base64Image, roboflowAnnotation, fileName, split);
    }

    /**
     * Build Roboflow-compatible annotation format
     * 
     * Roboflow expects annotations in this format:
     * {
     *   "image": { "width": 1024, "height": 768 },
     *   "annotations": [
     *     {
     *       "x": 512, "y": 384, "width": 128, "height": 96,
     *       "class": "faulty", "confidence": 0.95
     *     }
     *   ]
     * }
     */
    private ObjectNode buildRoboflowAnnotation(List<Annotation> annotations, int imageWidth, int imageHeight, String fileName) {
        ObjectNode root = objectMapper.createObjectNode();
        
        // Image metadata
        ObjectNode imageInfo = objectMapper.createObjectNode();
        imageInfo.put("width", imageWidth);
        imageInfo.put("height", imageHeight);
        imageInfo.put("name", fileName);
        root.set("image", imageInfo);
        
        // Annotations array
        ArrayNode annotationsArray = objectMapper.createArrayNode();
        
        for (Annotation annotation : annotations) {
            ObjectNode annNode = objectMapper.createObjectNode();
            
            // Bounding box in absolute coordinates
            annNode.put("x", annotation.getX());
            annNode.put("y", annotation.getY());
            annNode.put("width", annotation.getWidth());
            annNode.put("height", annotation.getHeight());
            
            // Class name
            annNode.put("class", annotation.getDetectionClass());
            
            // Optional: Include metadata
            annNode.put("annotationType", annotation.getAnnotationType());
            annNode.put("createdBy", annotation.getCreatedBy());
            
            if (annotation.getComments() != null && !annotation.getComments().isEmpty()) {
                annNode.put("note", annotation.getComments());
            }
            
            annotationsArray.add(annNode);
        }
        
        root.set("annotations", annotationsArray);
        
        logger.info("Built Roboflow annotation with {} boxes", annotations.size());
        
        return root;
    }

    /**
     * Upload image and annotations to Roboflow dataset
     */
    private JsonNode uploadToRoboflow(String base64Image, ObjectNode annotation, String fileName, String split) 
            throws IOException, InterruptedException {
        
        // Build upload URL
        String uploadUrl = ROBOFLOW_UPLOAD_URL
            .replace("{workspace}", WORKSPACE_ID)
            .replace("{project}", PROJECT_ID)
            + "?api_key=" + ROBOFLOW_API_KEY
            + "&name=" + fileName
            + "&split=" + (split != null ? split : "train");
        
        logger.info("Uploading to Roboflow: {}", uploadUrl);
        
        // Build request body
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("image", base64Image);
        requestBody.set("annotation", annotation);
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        
        // Make HTTP request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uploadUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
        
        logger.info("Sending upload request to Roboflow...");
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        logger.info("Roboflow response status: {}", response.statusCode());
        logger.info("Roboflow response body: {}", response.body());
        
        if (response.statusCode() != 200 && response.statusCode() != 201) {
            logger.error("Roboflow upload failed with status: {}", response.statusCode());
            throw new IOException("Failed to upload to Roboflow. Status: " + response.statusCode());
        }
        
        return objectMapper.readTree(response.body());
    }

    /**
     * Upload multiple images with their annotations (batch upload)
     * 
     * @param thermalImageIds List of thermal image IDs to upload
     * @param split Dataset split: "train", "valid", or "test"
     * @return Summary of upload results
     */
    public Map<String, Object> batchUploadImages(List<UUID> thermalImageIds, String split) {
        Map<String, Object> results = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        
        for (UUID imageId : thermalImageIds) {
            try {
                JsonNode response = uploadImageWithAnnotations(imageId, split);
                successCount++;
                logger.info("Successfully uploaded thermal image: {}", imageId);
            } catch (Exception e) {
                failureCount++;
                logger.error("Failed to upload thermal image {}: {}", imageId, e.getMessage());
            }
        }
        
        results.put("total", thermalImageIds.size());
        results.put("success", successCount);
        results.put("failure", failureCount);
        results.put("split", split);
        
        logger.info("Batch upload completed: {} success, {} failure", successCount, failureCount);
        
        return results;
    }

    /**
     * Upload all user-edited or user-added annotations for retraining
     * Only uploads images with user corrections (not pure AI detections)
     * 
     * @param split Dataset split: "train", "valid", or "test"
     * @return Summary of upload results
     */
    public Map<String, Object> uploadUserCorrectedAnnotations(String split) {
        logger.info("Finding all thermal images with user corrections...");
        
        // Get all annotations that are user-added or user-edited
        List<Annotation> userAnnotations = annotationRepository.findUserCorrectedAnnotations();
        
        // Get unique thermal image IDs
        List<UUID> thermalImageIds = userAnnotations.stream()
            .map(a -> a.getThermalImage().getId())
            .distinct()
            .toList();
        
        logger.info("Found {} thermal images with user corrections", thermalImageIds.size());
        
        if (thermalImageIds.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("message", "No user-corrected annotations found");
            result.put("total", 0);
            return result;
        }
        
        // Batch upload
        return batchUploadImages(thermalImageIds, split);
    }

    /**
     * Export annotations to YOLO format (alternative to Roboflow JSON)
     * YOLO format: <class_id> <x_center> <y_center> <width> <height> (normalized 0-1)
     */
    public String exportToYOLOFormat(UUID thermalImageId) throws IOException {
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found"));
        
        List<Annotation> annotations = annotationRepository.findByThermalImageIdAndNotDeleted(thermalImageId);
        
        // Get image dimensions (simplified - should use actual image dimensions)
        double maxX = annotations.stream().mapToDouble(a -> a.getX() + a.getWidth()).max().orElse(1024.0);
        double maxY = annotations.stream().mapToDouble(a -> a.getY() + a.getHeight()).max().orElse(768.0);
        
        StringBuilder yoloFormat = new StringBuilder();
        
        // Map class names to IDs (you should maintain a consistent mapping)
        Map<String, Integer> classMapping = new HashMap<>();
        classMapping.put("faulty", 0);
        classMapping.put("potentially_faulty", 1);
        classMapping.put("normal", 2);
        
        for (Annotation ann : annotations) {
            int classId = classMapping.getOrDefault(ann.getDetectionClass(), 0);
            
            // Convert to YOLO format (normalized center coordinates)
            double xCenter = (ann.getX() + ann.getWidth() / 2) / maxX;
            double yCenter = (ann.getY() + ann.getHeight() / 2) / maxY;
            double width = ann.getWidth() / maxX;
            double height = ann.getHeight() / maxY;
            
            yoloFormat.append(String.format("%d %.6f %.6f %.6f %.6f%n", 
                classId, xCenter, yCenter, width, height));
        }
        
        return yoloFormat.toString();
    }

    /**
     * Trigger model version generation on Roboflow
     * This creates a new version of the dataset and optionally trains a new model
     */
    public JsonNode triggerModelTraining(String datasetVersion) throws IOException, InterruptedException {
        String trainUrl = String.format(
            "https://api.roboflow.com/%s/%s/train?api_key=%s",
            WORKSPACE_ID, PROJECT_ID, ROBOFLOW_API_KEY
        );
        
        logger.info("Triggering model training at: {}", trainUrl);
        
        ObjectNode requestBody = objectMapper.createObjectNode();
        if (datasetVersion != null) {
            requestBody.put("version", datasetVersion);
        }
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(trainUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        logger.info("Training trigger response: {} - {}", response.statusCode(), response.body());
        
        return objectMapper.readTree(response.body());
    }
}

