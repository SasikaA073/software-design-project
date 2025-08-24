package com.EN3350.TF_Analyst;

import com.EN3350.TF_Analyst.Transformer.Transformer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TfAnalystApplication implements CommandLineRunner {

	public static void main(String[] args) {
        SpringApplication.run(TfAnalystApplication.class, args);
	}
    @Override
    public void run(String... args) throws Exception {
        Transformer transformer = new Transformer("A-01", "Kotte", "z001", Transformer.TransformerType.BULK, "Near the Junction");
        System.out.println(transformer);
    }
}
