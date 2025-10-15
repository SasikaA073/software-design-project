package com.example.transformermanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "thermal_images")
public class ThermalImage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inspection_id")
    private Inspection inspection;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private String imageType; // Baseline or Maintenance
    private String weatherCondition; // Sunny, Cloudy, Rainy (for maintenance images)
    private BigDecimal temperatureReading;
    private Boolean anomalyDetected;

    @Column(columnDefinition = "TEXT")
    private String detectionData; // JSON string containing bounding box detections (legacy/backup)

    @JsonIgnore
    @OneToMany(mappedBy = "thermalImage", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.List<Annotation> annotations = new java.util.ArrayList<>();

    @Column(updatable = false)
    private OffsetDateTime uploadedAt;

    @PrePersist
    protected void onPersist() {
        uploadedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }

    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public Inspection getInspection() {
        return inspection;
    }

    public void setInspection(Inspection inspection) {
        this.inspection = inspection;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageType() {
        return imageType;
    }

    public void setImageType(String imageType) {
        this.imageType = imageType;
    }

    public String getWeatherCondition() {
        return weatherCondition;
    }

    public void setWeatherCondition(String weatherCondition) {
        this.weatherCondition = weatherCondition;
    }

    public BigDecimal getTemperatureReading() {
        return temperatureReading;
    }

    public void setTemperatureReading(BigDecimal temperatureReading) {
        this.temperatureReading = temperatureReading;
    }

    public Boolean getAnomalyDetected() {
        return anomalyDetected;
    }

    public void setAnomalyDetected(Boolean anomalyDetected) {
        this.anomalyDetected = anomalyDetected;
    }

    public OffsetDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(OffsetDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getDetectionData() {
        return detectionData;
    }

    public void setDetectionData(String detectionData) {
        this.detectionData = detectionData;
    }

    public java.util.List<Annotation> getAnnotations() {
        return annotations;
    }

    public void setAnnotations(java.util.List<Annotation> annotations) {
        this.annotations = annotations;
    }
}
