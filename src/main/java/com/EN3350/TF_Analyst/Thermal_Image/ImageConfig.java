package com.EN3350.TF_Analyst.Thermal_Image;

import com.EN3350.TF_Analyst.Transformer.Transformer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

//import static com.EN3350.TF_Analyst.Thermal_Image.Image.ImageType.*;
//import static com.EN3350.TF_Analyst.Thermal_Image.Image.WeatherCondition.*;

@Configuration
public class ImageConfig {

    @Value("${app.image.storage-path}")
    private String storagePath;

    @Bean
    @Order(3)
    public CommandLineRunner imageRunner(ImageRepository imageRepository) {

        return args -> {
            String path = storagePath + "\\transformer\\AZ-10001\\baseline\\test1.jpg";
            Image image1 = new Image(
                    path,
                    Image.ImageType.BASELINE,
                    Image.WeatherCondition.SUNNY,
                    "Sayuru");
            Transformer transformer = new Transformer();
            transformer.setId(1L);
            image1.setTransformer(transformer);
            imageRepository.save(image1);
        };
    }
}
