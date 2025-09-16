package com.EN3350.TF_Analyst.Thermal_Image;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository
        extends JpaRepository<Image,Long> {

    boolean existsByInspectionIdAndWeatherCondition(
            Long ins_id,
            Image.WeatherCondition weatherCondition);
    boolean existsByTypeAndTransformerIdAndWeatherCondition(
            Image.ImageType imageType,
            Long transformer_id,
            Image.WeatherCondition weatherCondition);
}
