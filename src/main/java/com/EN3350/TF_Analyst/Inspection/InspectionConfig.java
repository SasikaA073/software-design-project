package com.EN3350.TF_Analyst.Inspection;

import com.EN3350.TF_Analyst.Transformer.Transformer;
import com.EN3350.TF_Analyst.Transformer.TransformerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Configuration
public class InspectionConfig {
    @Bean
    @Order(2)
    public CommandLineRunner inspectionRunner(InspectionRepository inspectionRepository, TransformerRepository transformerRepository) {
        return args -> {
            Inspection ins1 = new Inspection("nugegoda", LocalDate.now(), LocalTime.now());
            Inspection ins2 = new Inspection("kotte",  LocalDate.now().minusDays(41), LocalTime.now().minusMinutes(96));

            Transformer t1 = transformerRepository.findById(1L).orElseThrow();
            Transformer t2 = transformerRepository.findById(1L).orElseThrow();

            ins1.setTransformer(t1);
            ins2.setTransformer(t2);

            inspectionRepository.saveAll(
                    List.of(ins1, ins2)
            );
        };
    }
}
