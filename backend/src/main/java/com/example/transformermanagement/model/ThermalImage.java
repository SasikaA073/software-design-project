package com.example.transformermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "thermal_images")
@Data
public class ThermalImage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;

    @ManyToOne
    @JoinColumn(name = "inspection_id")
    private Inspection inspection;

    @Column(nullable = false)
    private String imageUrl;

    private String imageType;
    private BigDecimal temperatureReading;
    private Boolean anomalyDetected;

    @Column(updatable = false)
    private OffsetDateTime uploadedAt;

    @PrePersist
    protected void onPersist() {
        uploadedAt = OffsetDateTime.now();
    }
}
