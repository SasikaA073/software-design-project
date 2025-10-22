package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.FeedbackLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * FR3.3: Repository for Feedback Logs
 */
@Repository
public interface FeedbackLogRepository extends JpaRepository<FeedbackLog, UUID> {
    
    @Query("SELECT f FROM FeedbackLog f WHERE f.thermalImage.id = :thermalImageId ORDER BY f.createdAt DESC")
    List<FeedbackLog> findByThermalImageId(@Param("thermalImageId") UUID thermalImageId);
    
    @Query("SELECT f FROM FeedbackLog f WHERE f.feedbackType = :feedbackType ORDER BY f.createdAt DESC")
    List<FeedbackLog> findByFeedbackType(@Param("feedbackType") String feedbackType);
    
    @Query("SELECT f FROM FeedbackLog f WHERE f.usedForTraining = false ORDER BY f.createdAt DESC")
    List<FeedbackLog> findUnusedForTraining();
    
    @Query("SELECT f FROM FeedbackLog f WHERE f.createdAt BETWEEN :startDate AND :endDate ORDER BY f.createdAt DESC")
    List<FeedbackLog> findByDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT f FROM FeedbackLog f WHERE f.annotatorId = :annotatorId ORDER BY f.createdAt DESC")
    List<FeedbackLog> findByAnnotatorId(@Param("annotatorId") String annotatorId);
}
