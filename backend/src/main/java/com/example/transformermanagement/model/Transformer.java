package com.example.transformermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transformers")
@Data
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
}
