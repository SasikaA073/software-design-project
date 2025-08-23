package com.example.transformermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.OffsetDateTime;

@Entity
@Table(name = "alerts")
@Data
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID id;

    @ManyToOne
    @JoinColumn(name = "transformer_id")
    private Transformer transformer;

    @Column(nullable = false)
    private String alertType;

    @Column(nullable = false)
    private String message;

    private String severity;
    private Boolean isRead;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
