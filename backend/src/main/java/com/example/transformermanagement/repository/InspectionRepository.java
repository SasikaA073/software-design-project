package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, java.util.UUID> {
    List<Inspection> findByTransformer_Id(UUID transformerId);
}
