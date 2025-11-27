package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {
    
    // Find all records for a transformer
    @Query("SELECT m FROM MaintenanceRecord m " +
           "JOIN FETCH m.transformer t " +
           "JOIN FETCH m.inspection i " +
           "WHERE t.id = :transformerId " +
           "ORDER BY m.createdAt DESC")
    List<MaintenanceRecord> findByTransformerIdWithDetails(@Param("transformerId") UUID transformerId);

    // Find records for a specific inspection
    @Query("SELECT m FROM MaintenanceRecord m " +
           "JOIN FETCH m.transformer t " +
           "JOIN FETCH m.inspection i " +
           "WHERE i.id = :inspectionId")
    Optional<MaintenanceRecord> findByInspectionIdWithDetails(@Param("inspectionId") UUID inspectionId);

    // Find all records with joined data
    @Query("SELECT m FROM MaintenanceRecord m " +
           "JOIN FETCH m.transformer t " +
           "JOIN FETCH m.inspection i " +
           "ORDER BY m.createdAt DESC")
    List<MaintenanceRecord> findAllWithDetails();

    // Find by record number
    Optional<MaintenanceRecord> findByRecordNo(String recordNo);

    // Find record history for a transformer (all versions)
    @Query("SELECT m FROM MaintenanceRecord m " +
           "WHERE m.transformer.id = :transformerId " +
           "ORDER BY m.inspectionTimestamp DESC, m.versionNumber DESC")
    List<MaintenanceRecord> findTransformerRecordHistory(@Param("transformerId") UUID transformerId);

    // Find by transformer and inspection
    @Query("SELECT m FROM MaintenanceRecord m " +
           "WHERE m.transformer.id = :transformerId AND m.inspection.id = :inspectionId")
    Optional<MaintenanceRecord> findByTransformerAndInspection(
            @Param("transformerId") UUID transformerId,
            @Param("inspectionId") UUID inspectionId);
}
