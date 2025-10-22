package com.example.transformermanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for receiving detection data from frontend
 * Matches the Detection interface in frontend/lib/api.ts
 */
public class DetectionDTO {
    
    @JsonProperty("detection_id")
    private String detectionId;
    
    @JsonProperty("class")
    private String detectionClass;
    
    private Double confidence;
    private Double x;
    private Double y;
    private Double width;
    private Double height;
    
    // FR3.1 & FR3.2: Annotation metadata
    private String annotationType;
    private String comments;
    private String createdAt;
    private String createdBy;
    private String modifiedAt;
    private String modifiedBy;
    
    // Constructors
    public DetectionDTO() {}
    
    // Getters and Setters
    public String getDetectionId() {
        return detectionId;
    }
    
    public void setDetectionId(String detectionId) {
        this.detectionId = detectionId;
    }
    
    public String getDetectionClass() {
        return detectionClass;
    }
    
    public void setDetectionClass(String detectionClass) {
        this.detectionClass = detectionClass;
    }
    
    public Double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
    
    public Double getX() {
        return x;
    }
    
    public void setX(Double x) {
        this.x = x;
    }
    
    public Double getY() {
        return y;
    }
    
    public void setY(Double y) {
        this.y = y;
    }
    
    public Double getWidth() {
        return width;
    }
    
    public void setWidth(Double width) {
        this.width = width;
    }
    
    public Double getHeight() {
        return height;
    }
    
    public void setHeight(Double height) {
        this.height = height;
    }
    
    public String getAnnotationType() {
        return annotationType;
    }
    
    public void setAnnotationType(String annotationType) {
        this.annotationType = annotationType;
    }
    
    public String getComments() {
        return comments;
    }
    
    public void setComments(String comments) {
        this.comments = comments;
    }
    
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getModifiedAt() {
        return modifiedAt;
    }
    
    public void setModifiedAt(String modifiedAt) {
        this.modifiedAt = modifiedAt;
    }
    
    public String getModifiedBy() {
        return modifiedBy;
    }
    
    public void setModifiedBy(String modifiedBy) {
        this.modifiedBy = modifiedBy;
    }
}

