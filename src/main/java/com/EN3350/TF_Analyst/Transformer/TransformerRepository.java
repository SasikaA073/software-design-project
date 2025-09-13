package com.EN3350.TF_Analyst.Transformer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, Long> {
//    Optional<Transformer> findById(long id);
    @Query("SELECT t FROM Transformer t LEFT JOIN FETCH t.inspections WHERE t.id = :id")
    Optional<Transformer> findByIdWithInspections(@Param("id") Long id);
}
