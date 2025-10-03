package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, java.util.UUID> {
    List<Inspection> findByTransformer_Id(UUID transformerId);
    
    // Optimized queries with JOIN FETCH to avoid N+1 problem
    // Sorted by createdAt in descending order (newest first)
    @Query("SELECT i FROM Inspection i LEFT JOIN FETCH i.transformer ORDER BY i.createdAt DESC")
    List<Inspection> findAllWithTransformer();
    
    @Query("SELECT i FROM Inspection i LEFT JOIN FETCH i.transformer WHERE i.id = :id")
    Optional<Inspection> findByIdWithTransformer(@Param("id") UUID id);
    
    @Query("SELECT i FROM Inspection i LEFT JOIN FETCH i.transformer WHERE i.transformer.id = :transformerId ORDER BY i.createdAt DESC")
    List<Inspection> findByTransformerIdWithTransformer(@Param("transformerId") UUID transformerId);
}
