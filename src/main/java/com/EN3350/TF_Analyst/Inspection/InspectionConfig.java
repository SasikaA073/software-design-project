package com.EN3350.TF_Analyst.Inspection;

import com.EN3350.TF_Analyst.Transformer.Transformer;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;


@Configuration
public class InspectionConfig {
    @Bean
    @Order(2)
    public CommandLineRunner inspectionRunner(InspectionRepository inspectionRepository) {
        return args -> {
            Inspection ins1 = new Inspection(
                    "nugegoda");
            Inspection ins2 = new Inspection(
                    "kotte");

            Transformer t1 = new Transformer();
            Transformer t2 = new Transformer();

            t1.setId(1L);
            t2.setId(1L);

            ins1.setTransformer(t1);
            ins2.setTransformer(t2);

            inspectionRepository.saveAll(
                    List.of(ins1, ins2)
            );
        };
    }
}
