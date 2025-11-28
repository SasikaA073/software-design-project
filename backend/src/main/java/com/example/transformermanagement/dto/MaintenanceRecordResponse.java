package com.example.transformermanagement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record MaintenanceRecordResponse(
    UUID id,
    String recordNo,
    UUID transformerId,
    String transformerNo,
    UUID inspectionId,
    String inspectionNo,
    OffsetDateTime inspectionTimestamp,
    String thermalImageUrl,
    String thermalImageThumbnailUrl,
    String anomalyMarkersData,
    List<AnomalyDetailDTO> anomalyDetails, // NEW: Detailed anomaly information with source tracking
    String inspectorName,
    String transformerStatus,
    BigDecimal voltage,
    BigDecimal current,
    BigDecimal frequency,
    BigDecimal loadPercentage,
    String notes,
    String comments,
    String recommendedAction,
    String additionalRemarks,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime actionDueDate,
    Integer versionNumber,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String lastModifiedBy
) {}
