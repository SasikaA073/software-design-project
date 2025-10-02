package com.example.transformermanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Map;

@Service
public class AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);
    private static final String ANOMALY_DETECTION_API_URL = "https://serverless.roboflow.com/infer/workflows/isiriw/detect-count-and-visualize";
    private static final String API_KEY = "xLuuGmq6EfcX0kVtqEnA";
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public AnomalyDetectionService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Analyzes a maintenance image for anomalies using the detection API
     * @param imageUrl The relative URL of the uploaded maintenance image (e.g., /uploads/filename.jpg)
     * @return JSON response from Anomaly Detection API
     * @throws IOException If there's an error processing the request
     * @throws InterruptedException If the HTTP request is interrupted
     */
    public JsonNode analyzeMaintenanceImageForAnomalies(String imageUrl) throws IOException, InterruptedException {
        System.out.println("\n========================================");
        System.out.println("ANOMALY DETECTION - ANALYZING IMAGE");
        System.out.println("Image URL: " + imageUrl);
        System.out.println("========================================\n");
        
        // Extract filename from URL (e.g., /uploads/filename.jpg -> filename.jpg)
        String fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
        Path imagePath = Paths.get(uploadDir, fileName);
        
        System.out.println("Reading image file from: " + imagePath.toAbsolutePath());
        
        // Read image file and convert to base64
        byte[] imageBytes = Files.readAllBytes(imagePath);
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        
        System.out.println("Image converted to base64 (length: " + base64Image.length() + " characters)");
        
        // Prepare request body with base64 encoded image
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("api_key", API_KEY);
        
        Map<String, Object> inputs = new HashMap<>();
        Map<String, String> image = new HashMap<>();
        image.put("type", "base64");
        image.put("value", base64Image);
        inputs.put("image", image);
        
        requestBody.put("inputs", inputs);
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        
        System.out.println("Request body prepared (base64 image included)");
        System.out.println("API URL: " + ANOMALY_DETECTION_API_URL);
        
        // Make HTTP request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ANOMALY_DETECTION_API_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
        
        System.out.println("Sending HTTP POST request to Anomaly Detection API...");
        logger.info("Analyzing image for anomalies (base64): {}", fileName);
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        System.out.println("Response received - Status Code: " + response.statusCode());
        
        if (response.statusCode() != 200) {
            System.err.println("ERROR: API returned non-200 status code: " + response.statusCode());
            System.err.println("Response body: " + response.body());
            logger.error("Anomaly Detection API returned status code: {}", response.statusCode());
            throw new IOException("Failed to analyze image for anomalies. Status code: " + response.statusCode());
        }
        
        System.out.println("\n=== ANOMALY DETECTION API RESPONSE ===");
        System.out.println(response.body());
        System.out.println("=== END OF API RESPONSE ===\n");
        
        logger.info("Successfully received anomaly detection response");
        
        JsonNode jsonResponse = objectMapper.readTree(response.body());
        
        // Log key information from response
        if (jsonResponse.isArray() && jsonResponse.size() > 0) {
            JsonNode firstResult = jsonResponse.get(0);
            if (firstResult.has("count_objects")) {
                int anomalyCount = firstResult.get("count_objects").asInt();
                System.out.println("🔍 ANOMALY COUNT: " + anomalyCount);
                logger.info("Detected {} anomalies in the image", anomalyCount);
            }
        }
        
        System.out.println("========================================\n");
        
        return jsonResponse;
    }
}
