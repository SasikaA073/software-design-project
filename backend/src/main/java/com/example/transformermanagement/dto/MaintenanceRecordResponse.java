package com.example.transformermanagement.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
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
    OffsetDateTime actionDueDate,
    Integer versionNumber,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String lastModifiedBy
) {}
