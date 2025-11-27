package com.example.transformermanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "maintenance_records")
public class MaintenanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String recordNo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    // FR4.1: Maintenance Record Metadata
    @Column(nullable = false)
    private OffsetDateTime inspectionTimestamp;

    private String thermalImageUrl;
    private String thermalImageThumbnailUrl;
    private String anomalyMarkersData; // JSON data of anomaly annotations

    // FR4.2: Engineer Input Fields
    private String inspectorName;
    
    @Enumerated(EnumType.STRING)
    private TransformerStatus transformerStatus; // OK, Needs Maintenance, Urgent Attention

    private BigDecimal voltage;
    private BigDecimal current;
    private BigDecimal frequency;
    private BigDecimal loadPercentage;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(columnDefinition = "TEXT")
    private String additionalRemarks;

    private OffsetDateTime actionDueDate;

    // FR4.3: Record Versioning and Traceability
    @Column(nullable = false)
    private Integer versionNumber = 1;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @Column(length = 50)
    private String lastModifiedBy;

    // Enum for transformer status
    public enum TransformerStatus {
        OK,
        NEEDS_MAINTENANCE,
        URGENT_ATTENTION
    }

    // JPA Callbacks
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (recordNo == null) {
            recordNo = "MR-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getRecordNo() {
        return recordNo;
    }

    public void setRecordNo(String recordNo) {
        this.recordNo = recordNo;
    }

    public Transformer getTransformer() {
        return transformer;
    }

    public void setTransformer(Transformer transformer) {
        this.transformer = transformer;
    }

    public Inspection getInspection() {
        return inspection;
    }

    public void setInspection(Inspection inspection) {
        this.inspection = inspection;
    }

    public OffsetDateTime getInspectionTimestamp() {
        return inspectionTimestamp;
    }

    public void setInspectionTimestamp(OffsetDateTime inspectionTimestamp) {
        this.inspectionTimestamp = inspectionTimestamp;
    }

    public String getThermalImageUrl() {
        return thermalImageUrl;
    }

    public void setThermalImageUrl(String thermalImageUrl) {
        this.thermalImageUrl = thermalImageUrl;
    }

    public String getThermalImageThumbnailUrl() {
        return thermalImageThumbnailUrl;
    }

    public void setThermalImageThumbnailUrl(String thermalImageThumbnailUrl) {
        this.thermalImageThumbnailUrl = thermalImageThumbnailUrl;
    }

    public String getAnomalyMarkersData() {
        return anomalyMarkersData;
    }

    public void setAnomalyMarkersData(String anomalyMarkersData) {
        this.anomalyMarkersData = anomalyMarkersData;
    }

    public String getInspectorName() {
        return inspectorName;
    }

    public void setInspectorName(String inspectorName) {
        this.inspectorName = inspectorName;
    }

    public TransformerStatus getTransformerStatus() {
        return transformerStatus;
    }

    public void setTransformerStatus(TransformerStatus transformerStatus) {
        this.transformerStatus = transformerStatus;
    }

    public BigDecimal getVoltage() {
        return voltage;
    }

    public void setVoltage(BigDecimal voltage) {
        this.voltage = voltage;
    }

    public BigDecimal getCurrent() {
        return current;
    }

    public void setCurrent(BigDecimal current) {
        this.current = current;
    }

    public BigDecimal getFrequency() {
        return frequency;
    }

    public void setFrequency(BigDecimal frequency) {
        this.frequency = frequency;
    }

    public BigDecimal getLoadPercentage() {
        return loadPercentage;
    }

    public void setLoadPercentage(BigDecimal loadPercentage) {
        this.loadPercentage = loadPercentage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public String getAdditionalRemarks() {
        return additionalRemarks;
    }

    public void setAdditionalRemarks(String additionalRemarks) {
        this.additionalRemarks = additionalRemarks;
    }

    public OffsetDateTime getActionDueDate() {
        return actionDueDate;
    }

    public void setActionDueDate(OffsetDateTime actionDueDate) {
        this.actionDueDate = actionDueDate;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }
}
