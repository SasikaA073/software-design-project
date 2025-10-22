package com.example.transformermanagement.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * FR3.3: Feedback Log for Model Improvement
 * 
 * Maintains a record of AI predictions vs user corrections for training data
 * This entity captures the feedback loop between AI-generated detections and
 * final user-accepted annotations.
 */
@Entity
@Table(name = "feedback_logs")
public class FeedbackLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id", nullable = false)
    private ThermalImage thermalImage;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annotation_id", nullable = true)
    private Annotation annotation;
    
    // Original AI prediction data (JSON format)
    @Column(columnDefinition = "TEXT", name = "ai_prediction")
    private String aiPrediction;
    
    // Final user-modified annotation data (JSON format)
    @Column(columnDefinition = "TEXT", name = "final_annotation")
    private String finalAnnotation;
    
    // Feedback type: "correction", "addition", "deletion", "no_change"
    @Column(nullable = false, name = "feedback_type")
    private String feedbackType;
    
    // Annotator metadata
    @Column(name = "annotator_id")
    private String annotatorId;
    
    @Column(name = "annotator_name")
    private String annotatorName;
    
    @Column(name = "annotator_role")
    private String annotatorRole;
    
    // Timestamps
    @Column(nullable = false, name = "created_at")
    private OffsetDateTime createdAt;
    
    @Column(name = "exported_at")
    private OffsetDateTime exportedAt;
    
    // Flag to track if this has been used for training
    @Column(name = "used_for_training", nullable = false)
    private Boolean usedForTraining = false;
    
    // Additional context
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
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
    
    public Annotation getAnnotation() {
        return annotation;
    }
    
    public void setAnnotation(Annotation annotation) {
        this.annotation = annotation;
    }
    
    public String getAiPrediction() {
        return aiPrediction;
    }
    
    public void setAiPrediction(String aiPrediction) {
        this.aiPrediction = aiPrediction;
    }
    
    public String getFinalAnnotation() {
        return finalAnnotation;
    }
    
    public void setFinalAnnotation(String finalAnnotation) {
        this.finalAnnotation = finalAnnotation;
    }
    
    public String getFeedbackType() {
        return feedbackType;
    }
    
    public void setFeedbackType(String feedbackType) {
        this.feedbackType = feedbackType;
    }
    
    public String getAnnotatorId() {
        return annotatorId;
    }
    
    public void setAnnotatorId(String annotatorId) {
        this.annotatorId = annotatorId;
    }
    
    public String getAnnotatorName() {
        return annotatorName;
    }
    
    public void setAnnotatorName(String annotatorName) {
        this.annotatorName = annotatorName;
    }
    
    public String getAnnotatorRole() {
        return annotatorRole;
    }
    
    public void setAnnotatorRole(String annotatorRole) {
        this.annotatorRole = annotatorRole;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getExportedAt() {
        return exportedAt;
    }
    
    public void setExportedAt(OffsetDateTime exportedAt) {
        this.exportedAt = exportedAt;
    }
    
    public Boolean getUsedForTraining() {
        return usedForTraining;
    }
    
    public void setUsedForTraining(Boolean usedForTraining) {
        this.usedForTraining = usedForTraining;
    }
    
    public String getComments() {
        return comments;
    }
    
    public void setComments(String comments) {
        this.comments = comments;
    }
}
