package com.EN3350.TF_Analyst.Transformer;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;


@Configuration
public class TransformerConfig {
    @Bean
    @Order(1)
    CommandLineRunner cmdLnRnr(TransformerRepository tfRepo){
        return args -> {

            Transformer tf1 = new Transformer( "Kotte", "z001",
                    Transformer.TransformerType.BULK, "Near the Junction");

            Transformer tf2 = new Transformer( "Nugegoda", "z021",
                    Transformer.TransformerType.DISTRIBUTION, "Beside the Market");

            Transformer tf3 = new Transformer("Moratuwa", "z037",
                    Transformer.TransformerType.BULK, "At the Station");

            tfRepo.saveAll(
                    List.of(tf1, tf2, tf3)
            );
        };
    }
}

