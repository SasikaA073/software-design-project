package com.example.transformermanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transformers")
public class Transformer {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;

    @Column(unique = true, nullable = false)
    private String transformerNo;

    @Column(nullable = false)
    private String poleNo;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false)
    private String type;

    private String locationDetails;
    private BigDecimal capacity;
    private Integer noOfFeeders;
    private String status;
    private OffsetDateTime lastInspected;

    // Baseline images for different weather conditions
    private String sunnyBaselineImageUrl;
    private String cloudyBaselineImageUrl;
    private String rainyBaselineImageUrl;
    
    @JsonIgnore
    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.List<Inspection> inspections = new java.util.ArrayList<>();

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

    public String getTransformerNo() {
        return transformerNo;
    }

    public void setTransformerNo(String transformerNo) {
        this.transformerNo = transformerNo;
    }

    public String getPoleNo() {
        return poleNo;
    }

    public void setPoleNo(String poleNo) {
        this.poleNo = poleNo;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLocationDetails() {
        return locationDetails;
    }

    public void setLocationDetails(String locationDetails) {
        this.locationDetails = locationDetails;
    }

    public BigDecimal getCapacity() {
        return capacity;
    }

    public void setCapacity(BigDecimal capacity) {
        this.capacity = capacity;
    }

    public Integer getNoOfFeeders() {
        return noOfFeeders;
    }

    public void setNoOfFeeders(Integer noOfFeeders) {
        this.noOfFeeders = noOfFeeders;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getLastInspected() {
        return lastInspected;
    }

    public void setLastInspected(OffsetDateTime lastInspected) {
        this.lastInspected = lastInspected;
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

    public String getSunnyBaselineImageUrl() {
        return sunnyBaselineImageUrl;
    }

    public void setSunnyBaselineImageUrl(String sunnyBaselineImageUrl) {
        this.sunnyBaselineImageUrl = sunnyBaselineImageUrl;
    }

    public String getCloudyBaselineImageUrl() {
        return cloudyBaselineImageUrl;
    }

    public void setCloudyBaselineImageUrl(String cloudyBaselineImageUrl) {
        this.cloudyBaselineImageUrl = cloudyBaselineImageUrl;
    }

    public String getRainyBaselineImageUrl() {
        return rainyBaselineImageUrl;
    }

    public void setRainyBaselineImageUrl(String rainyBaselineImageUrl) {
        this.rainyBaselineImageUrl = rainyBaselineImageUrl;
    }
}
