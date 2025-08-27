package com.example.transformermanagement.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "inspections")
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;

    @Column(unique = true, nullable = false)
    private String inspectionNo;

    @ManyToOne
    @JoinColumn(name = "transformer_id")
    private Transformer transformer;

    @Column(nullable = false)
    private OffsetDateTime inspectedDate;

    private OffsetDateTime maintenanceDate;

    private String status;
    private String inspectedBy;
    private String weatherCondition;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }

    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public String getInspectionNo() {
        return inspectionNo;
    }

    public void setInspectionNo(String inspectionNo) {
        this.inspectionNo = inspectionNo;
    }

    public Transformer getTransformer() {
        return transformer;
    }

    public void setTransformer(Transformer transformer) {
        this.transformer = transformer;
    }

    public OffsetDateTime getInspectedDate() {
        return inspectedDate;
    }

    public void setInspectedDate(OffsetDateTime inspectedDate) {
        this.inspectedDate = inspectedDate;
    }

    public OffsetDateTime getMaintenanceDate() {
        return maintenanceDate;
    }

    public void setMaintenanceDate(OffsetDateTime maintenanceDate) {
        this.maintenanceDate = maintenanceDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getInspectedBy() {
        return inspectedBy;
    }

    public void setInspectedBy(String inspectedBy) {
        this.inspectedBy = inspectedBy;
    }

    public String getWeatherCondition() {
        return weatherCondition;
    }

    public void setWeatherCondition(String weatherCondition) {
        this.weatherCondition = weatherCondition;
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
}
