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

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URL;
import java.net.HttpURLConnection;
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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
/**
 * Service for uploading annotated images to Roboflow for model retraining
 */
@Service
public class RoboflowDatasetService {

    private static final Logger logger = LoggerFactory.getLogger(RoboflowDatasetService.class);
    
    // Roboflow Upload API configuration (defaults; prefer overriding via properties)
    private static final String ROBOFLOW_UPLOAD_URL = "https://api.roboflow.com/dataset/{dataset}/upload";
    private static final String DEFAULT_ROBOFLOW_API_KEY = "xLuuGmq6EfcX0kVtqEnA"; // Consider moving to properties
    private static final String DEFAULT_DATASET_NAME = "transformer-thermal-images-bpkdr"; // Dataset slug from Roboflow URL
    
    
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    
    @Autowired
    private AnnotationRepository annotationRepository;
    
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    // Prefer configuration over constants; fall back to defaults if unset
    @Value("${roboflow.apiKey:}")
    private String roboflowApiKey;
    
    @Value("${roboflow.dataset:}")
    private String roboflowDataset;

        // Add these two lines
    @Value("${roboflow.workspace:}")
    private String roboflowWorkspace;

    @Value("${roboflow.project:}")
    private String roboflowProject;
    
    // Optional properties (manual overrides) for annotate endpoint
    // Note: annotate path segment is the dataset image item ID (e.g., "abc123"), NOT a version
    @Value("${roboflow.annotatePath:}")
    private String roboflowAnnotatePath;

    // Toggle automatic annotate after image upload (separate endpoint)
    @Value("${roboflow.autoAnnotate:true}")
    private boolean roboflowAutoAnnotate;
    
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
        logger.debug("Resolved uploadDir={}, fileName={}, imagePath={}", uploadDir, fileName, imagePath);
        
        if (!Files.exists(imagePath)) {
            throw new RuntimeException("Image file not found: " + imagePath);
        }

        // Always upload the image using image-only endpoint
        JsonNode uploadResponse = uploadImage(thermalImageId, split);
        boolean duplicate = uploadResponse.path("duplicate").asBoolean(false);
        logger.info("Upload completed. duplicate={} id={}", duplicate, uploadResponse.path("id").asText(null));
        JsonNode annotateResp = null;
        // Optionally annotate the image immediately so labels are applied/updated
        if (roboflowAutoAnnotate) {
            // Prefer the item ID returned by upload response; fallback to property if absent
            String imageItemId = uploadResponse.path("id").asText(null);
            if (imageItemId == null || imageItemId.isBlank()) {
                imageItemId = (roboflowAnnotatePath != null && !roboflowAnnotatePath.isBlank()) ? roboflowAnnotatePath : null;
            }

            logger.info("Auto-annotate enabled. file={} using imageItemId={}", fileName, (imageItemId != null ? imageItemId : "<unset>"));

            if (imageItemId == null) {
                logger.warn("No image item ID available for annotation (upload response did not include 'id' and no 'roboflow.annotatePath' set). Skipping annotation.");
            } else {
                int attempts = 0;
                int maxAttempts = 3;
                long backoffMs = 1000;

                Exception lastError = null;
                while (attempts < maxAttempts) {
                    try {
                        attempts++;
                        annotateResp = uploadAnnotation(thermalImageId, imageItemId);
                        logger.info("Annotate success on attempt {}: status={}, response={}", attempts, annotateResp.path("status").asText(""), annotateResp.toString());
                        break; // success
                    } catch (Exception e) {
                        lastError = e;
                        logger.warn("Annotate attempt {}/{} failed: {}", attempts, maxAttempts, e.getMessage(), e);
                        if (attempts < maxAttempts) {
                            Thread.sleep(backoffMs);
                            backoffMs *= 2; // exponential backoff
                        } else {
                            logger.error("Annotate failed after {} attempts. Proceeding without blocking upload.");
                        }
                    }
                }
            }
        }

        return uploadResponse;
    }

    /**
     * Public method: upload only the image bytes to Roboflow for a given thermal image ID.
     * Mirrors the Roboflow docs example (application/x-www-form-urlencoded with base64 body).
     */
    public JsonNode uploadImage(UUID thermalImageId, String split) throws IOException {
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found: " + thermalImageId));

        String fileName = thermalImage.getImageUrl().substring(thermalImage.getImageUrl().lastIndexOf('/') + 1);
        Path imagePath = Paths.get(uploadDir, fileName);
        logger.debug("[uploadImage] Resolved uploadDir={}, fileName={}, imagePath={}", uploadDir, fileName, imagePath);
        if (!Files.exists(imagePath)) {
            throw new IOException("Image file not found: " + imagePath);
        }
        byte[] imageBytes = Files.readAllBytes(imagePath);
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        logger.debug("[uploadImage] Image bytes={}, base64 length={}", imageBytes.length, base64Image.length());

        return uploadImageToRoboflow(base64Image, fileName, split);
    }

    /**
     * Public method: upload only annotations for a given thermal image ID (YOLO txt),
     * using Roboflow annotate API and the dataset image item ID as path segment.
     */
    public JsonNode uploadAnnotation(UUID thermalImageId, String imageItemId) throws IOException {
        return annotateImageInRoboflow(thermalImageId, imageItemId);
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
    private JsonNode uploadImageToRoboflow(String base64Image, String fileName, String split)
        throws IOException {
        // Resolve config with fallback
        String apiKey = (roboflowApiKey != null && !roboflowApiKey.isBlank()) ? roboflowApiKey : DEFAULT_ROBOFLOW_API_KEY;
        String dataset = (roboflowDataset != null && !roboflowDataset.isBlank()) ? roboflowDataset : DEFAULT_DATASET_NAME;

        // Encode params
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);
        String encodedSplit = URLEncoder.encode((split != null ? split : "train"), StandardCharsets.UTF_8);

    // Build upload URL per Roboflow docs; image-only upload
        String uploadUrl = ROBOFLOW_UPLOAD_URL
                .replace("{dataset}", dataset)
                + "?api_key=" + apiKey
                + "&name=" + encodedName
        + "&split=" + encodedSplit;

    String uploadUrlSafe = uploadUrl.replace(apiKey, "****");
    String maskedKey = apiKey.length() > 8 ? apiKey.substring(0, 4) + "***" + apiKey.substring(apiKey.length() - 4) : "****";
    logger.info("Uploading image to Roboflow. dataset={}, name={}, split={}, url={}",
        dataset, fileName, (split != null ? split : "train"), uploadUrlSafe);
    logger.debug("API key (masked)={}", maskedKey);

        HttpURLConnection connection = null;
        try {
            URL url = new URL(uploadUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            connection.setRequestProperty("Content-Length", Integer.toString(base64Image.getBytes(StandardCharsets.US_ASCII).length));
            connection.setRequestProperty("Content-Language", "en-US");
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            // Send base64 image as body
            try (DataOutputStream wr = new DataOutputStream(connection.getOutputStream())) {
                wr.write(base64Image.getBytes(StandardCharsets.US_ASCII));
                wr.flush();
            }

            int status = connection.getResponseCode();
            InputStream is = (status >= 200 && status < 300) ? connection.getInputStream() : connection.getErrorStream();
            StringBuilder responseBody = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
            }

            logger.info("Roboflow upload status: {}", status);
            logger.info("Roboflow upload body: {}", responseBody);

            if (status != 200 && status != 201) {
                throw new IOException("Failed to upload to Roboflow. Status: " + status + ", body: " + responseBody);
            }

            return objectMapper.readTree(responseBody.toString());
        } catch (IOException e) {
            logger.error("Error uploading to Roboflow: {}", e.getMessage());
            throw e;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    // Removed inline image+annotation upload method to keep endpoints separate as requested

    /**
     * Annotate an already-uploaded image in Roboflow using YOLO txt content and a labelmap.
     * Path segment after /annotate/ is the dataset image item ID (e.g., "abc123").
     * Sends JSON payload: {"annotationFile": "...", "labelmap": {"0":"faulty", ...}} with Content-Type: application/json
     *
     * @param thermalImageId The ID of the thermal image whose annotations to upload
     * @param imageItemId Roboflow dataset image item ID (from upload response 'id'); if null, falls back to property 'roboflow.annotatePath'
     */
    public JsonNode annotateImageInRoboflow(UUID thermalImageId, String imageItemId) throws IOException {
        // Resolve config
        String apiKey = (roboflowApiKey != null && !roboflowApiKey.isBlank()) ? roboflowApiKey : DEFAULT_ROBOFLOW_API_KEY;
        String dataset = (roboflowDataset != null && !roboflowDataset.isBlank()) ? roboflowDataset : DEFAULT_DATASET_NAME;
        String resolvedPath = (imageItemId != null && !imageItemId.isBlank())
                ? imageItemId
                : ((roboflowAnnotatePath != null && !roboflowAnnotatePath.isBlank()) ? roboflowAnnotatePath : null);
        if (resolvedPath == null || resolvedPath.isBlank()) {
            throw new IllegalStateException("No annotate path segment (image item ID) provided. Supply the upload response 'id' or set 'roboflow.annotatePath'.");
        }

        // Load image to derive annotation file name
        ThermalImage thermalImage = thermalImageRepository.findById(thermalImageId)
            .orElseThrow(() -> new RuntimeException("Thermal image not found: " + thermalImageId));

        String imageFileName = thermalImage.getImageUrl().substring(thermalImage.getImageUrl().lastIndexOf('/') + 1);
        String baseName = imageFileName;
        int dot = imageFileName.lastIndexOf('.');
        if (dot > 0) {
            baseName = imageFileName.substring(0, dot);
        }
        String annotationFileName = baseName + ".txt";

        // Build YOLO txt content from our annotations
        String yoloTxt = exportToYOLOFormat(thermalImageId);

        // Build labelmap consistent with exportToYOLOFormat mapping
        Map<String, Integer> classMapping = new HashMap<>();
        classMapping.put("faulty", 0);
        classMapping.put("potentially_faulty", 1);
        classMapping.put("normal", 2);

        ObjectNode labelmapNode = objectMapper.createObjectNode();
        for (Map.Entry<String, Integer> e : classMapping.entrySet()) {
            labelmapNode.put(String.valueOf(e.getValue()), e.getKey());
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("annotationFile", yoloTxt);
        payload.set("labelmap", labelmapNode);

    // Build annotate URL
        String encodedName = URLEncoder.encode(annotationFileName, StandardCharsets.UTF_8);
    String annotateUrl = "https://api.roboflow.com/dataset/" + dataset + "/annotate/" + resolvedPath
                + "?api_key=" + apiKey
                + "&name=" + encodedName;

    String annotateUrlSafe = annotateUrl.replace(apiKey, "****");
    String maskedKey = apiKey.length() > 8 ? apiKey.substring(0, 4) + "***" + apiKey.substring(apiKey.length() - 4) : "****";
    logger.info("Annotating in Roboflow. dataset={}, pathSegment={}, annotationFile={}, yoloLength={}, url={}",
        dataset, resolvedPath, annotationFileName, (yoloTxt != null ? yoloTxt.length() : 0), annotateUrlSafe);
    if (yoloTxt == null || yoloTxt.isBlank()) {
        logger.warn("YOLO annotation text is empty for image {}. Annotation may be ignored.", imageFileName);
    } else {
        String firstLine = yoloTxt.split("\\n", 2)[0];
        logger.debug("YOLO first line preview='{}'", firstLine);
    }
    logger.debug("API key (masked)={}", maskedKey);

        HttpURLConnection connection = null;
        try {
            URL url = new URL(annotateUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            // Send annotation JSON: { annotationFile: "...", labelmap: {...} }
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            String jsonBody = objectMapper.writeValueAsString(payload);
            logger.debug("Annotate payload size={} bytes (application/json)", jsonBody.getBytes(StandardCharsets.UTF_8).length);
            try (DataOutputStream wr = new DataOutputStream(connection.getOutputStream())) {
                wr.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                wr.flush();
            }

            int status = connection.getResponseCode();
            InputStream is = (status >= 200 && status < 300) ? connection.getInputStream() : connection.getErrorStream();
            StringBuilder responseBody = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
            }

            logger.info("Roboflow annotate status: {}", status);
            logger.info("Roboflow annotate body: {}", responseBody);

            if (status != 200 && status != 201) {
                throw new IOException("Failed to annotate in Roboflow. Status: " + status + ", body: " + responseBody);
            }

            return objectMapper.readTree(responseBody.toString());
        } finally {
            if (connection != null) connection.disconnect();
        }
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
        // Resolve config with fallback to existing defaults
        String apiKey = (roboflowApiKey != null && !roboflowApiKey.isBlank()) ? roboflowApiKey : DEFAULT_ROBOFLOW_API_KEY;
        String workspace = (roboflowWorkspace != null && !roboflowWorkspace.isBlank()) ? roboflowWorkspace : "";
        // Use roboflow.project if set; otherwise fall back to dataset slug
        String project = (roboflowProject != null && !roboflowProject.isBlank())
                ? roboflowProject
                : ((roboflowDataset != null && !roboflowDataset.isBlank()) ? roboflowDataset : DEFAULT_DATASET_NAME);

        if (workspace.isBlank()) {
            throw new IllegalStateException("roboflow.workspace is not configured");
        }
        if (project.isBlank()) {
            throw new IllegalStateException("roboflow.project (or roboflow.dataset) is not configured");
        }

        String trainUrl = String.format(
            "https://api.roboflow.com/%s/%s/train?api_key=%s",
            workspace, project, apiKey
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

// ...existing code...
}
