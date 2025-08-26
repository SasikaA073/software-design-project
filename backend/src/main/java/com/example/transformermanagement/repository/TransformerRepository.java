package com.example.transformermanagement.repository;

import com.example.transformermanagement.model.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, java.util.UUID> {
}
