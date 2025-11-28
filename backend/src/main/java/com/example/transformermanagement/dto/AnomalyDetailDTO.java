package com.example.transformermanagement.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO for detailed anomaly information including source tracking
 */
public record AnomalyDetailDTO(
    UUID id,
    String detectionId,
    String annotationType, // ai_detected, user_added, user_edited
    String detectionClass,  // Faulty, Potentially Faulty, Normal
    Double confidence,
    Double x,
    Double y,
    Double width,
    Double height,
    String comments,
    String createdBy,
    OffsetDateTime createdAt,
    String modifiedBy,
    OffsetDateTime modifiedAt,
    UUID thermalImageId
) {}
