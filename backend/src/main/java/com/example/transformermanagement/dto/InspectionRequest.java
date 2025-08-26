package com.example.transformermanagement.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

// DTO used to create or update an Inspection while supplying transformerId explicitly
public record InspectionRequest(
        String inspectionNo,
        UUID transformerId,
        OffsetDateTime inspectedDate,
        OffsetDateTime maintenanceDate,
        String status,
        String inspectedBy,
        String weatherCondition
) {}
