package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, UUID> {
    
    @Query("SELECT a FROM Annotation a WHERE a.thermalImage.id = :thermalImageId AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Annotation> findByThermalImageIdAndNotDeleted(@Param("thermalImageId") UUID thermalImageId);
    
    @Query("SELECT a FROM Annotation a WHERE a.thermalImage.id = :thermalImageId ORDER BY a.createdAt DESC")
    List<Annotation> findByThermalImageId(@Param("thermalImageId") UUID thermalImageId);
    
    @Query("SELECT a FROM Annotation a WHERE a.isDeleted = false AND (a.annotationType = 'user_added' OR a.annotationType = 'user_edited') ORDER BY a.createdAt DESC")
    List<Annotation> findUserCorrectedAnnotations();
}

