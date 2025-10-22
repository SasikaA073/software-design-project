package com.example.transformermanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "annotations")
public class Annotation {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ThermalImage thermalImage;

    // FR3.2: Store transformer ID for easier querying
    @Column(name = "transformer_id")
    private java.util.UUID transformerId;

    @Column(nullable = false)
    private String detectionId; // Links to detection_id in the detection data

    @Column(nullable = false)
    private String annotationType; // ai_detected, user_added, user_edited, user_deleted

    @Column(nullable = false)
    private String detectionClass; // Faulty, Potentially Faulty, Normal

    @Column(nullable = false)
    private Double confidence;

    @Column(nullable = false)
    private Double x;

    @Column(nullable = false)
    private Double y;

    @Column(nullable = false)
    private Double width;

    @Column(nullable = false)
    private Double height;

    @Column(columnDefinition = "TEXT")
    private String comments; // Optional user comments/notes

    @Column(nullable = false)
    private String createdBy; // User ID who created this annotation

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    private String modifiedBy; // User ID who last modified this annotation

    private OffsetDateTime modifiedAt;

    @Column(nullable = false)
    private Boolean isDeleted = false; // Soft delete flag

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (modifiedAt == null) {
            modifiedAt = createdAt;
        }
        if (modifiedBy == null) {
            modifiedBy = createdBy;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }

    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public ThermalImage getThermalImage() {
        return thermalImage;
    }

    public void setThermalImage(ThermalImage thermalImage) {
        this.thermalImage = thermalImage;
    }

    public String getDetectionId() {
        return detectionId;
    }

    public void setDetectionId(String detectionId) {
        this.detectionId = detectionId;
    }

    public String getAnnotationType() {
        return annotationType;
    }

    public void setAnnotationType(String annotationType) {
        this.annotationType = annotationType;
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

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(String modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public OffsetDateTime getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(OffsetDateTime modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public java.util.UUID getTransformerId() {
        return transformerId;
    }

    public void setTransformerId(java.util.UUID transformerId) {
        this.transformerId = transformerId;
    }
}

