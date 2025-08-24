package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.ThermalImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ThermalImageRepository extends JpaRepository<ThermalImage, UUID> {
    List<ThermalImage> findByInspectionId(UUID inspectionId);
    List<ThermalImage> findByInspectionIdAndImageTypeIgnoreCase(UUID inspectionId, String imageType);
}
