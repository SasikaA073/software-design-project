package com.EN3350.TF_Analyst;

import com.EN3350.TF_Analyst.Inspection.Inspection;
import com.EN3350.TF_Analyst.Inspection.InspectionRepository;
import com.EN3350.TF_Analyst.Transformer.Transformer;
import com.EN3350.TF_Analyst.Transformer.TransformerRepository;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;

import java.util.List;

@SpringBootApplication
public class TfAnalystApplication{
	public static void main(String[] args) {
        SpringApplication.run(TfAnalystApplication.class, args);
	}
    @Bean
    @Order(3)
    @Transactional
    public CommandLineRunner commandLineRunner(InspectionRepository inspectionRepository,
                                               TransformerRepository transformerRepository) {
        return args -> {
//            Transformer transformer1 = transformerRepository.findById(1L).orElseThrow();
            transformerRepository.findByIdWithInspections(1L)
                    .ifPresent(transformer -> {
                        System.out.println("fetch inspection lazy...");
                        List<Inspection> inspections = transformer.getInspections();
                        inspections.forEach(inspection -> {
                            System.out.println(
                                    transformer.getTransformerNo() + " has inspection " + inspection.getInspectionNo());
                        });
                    });
        };
    }
}
