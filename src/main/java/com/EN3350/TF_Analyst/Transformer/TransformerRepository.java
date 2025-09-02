package com.EN3350.TF_Analyst.Transformer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, Long> {
//    Optional<Transformer> findById(long id);
}
