package com.example.transformermanagement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime actionDueDate,
    String lastModifiedBy
) {}
