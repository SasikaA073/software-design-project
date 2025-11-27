package com.example.transformermanagement.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MaintenanceRecordRequest(
    UUID transformerId,
    UUID inspectionId,
    String thermalImageUrl,
    String thermalImageThumbnailUrl,
    String anomalyMarkersData,
    String inspectorName,
    String transformerStatus, // "OK", "NEEDS_MAINTENANCE", "URGENT_ATTENTION"
    BigDecimal voltage,
    BigDecimal current,
    BigDecimal frequency,
    BigDecimal loadPercentage,
    String notes,
    String comments,
    String recommendedAction,
    String additionalRemarks,
    OffsetDateTime actionDueDate,
    String lastModifiedBy
) {}
