package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertRepository extends JpaRepository<Alert, java.util.UUID> {
}
