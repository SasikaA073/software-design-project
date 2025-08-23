package com.example.transformermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.OffsetDateTime;

@Entity
@Table(name = "inspections")
@Data
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
}
