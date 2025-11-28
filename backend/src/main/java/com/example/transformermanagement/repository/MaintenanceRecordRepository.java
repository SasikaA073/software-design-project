package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {
    List<MaintenanceRecord> findByTransformerId(UUID transformerId);
    List<MaintenanceRecord> findByTransformerIdOrderByCreatedAtDesc(UUID transformerId);
    Optional<MaintenanceRecord> findByInspectionId(UUID inspectionId);
    Optional<MaintenanceRecord> findByRecordNo(String recordNo);
    boolean existsByTransformerIdAndInspectionId(UUID transformerId, UUID inspectionId);
}

