package com.example.transformermanagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOriginPatterns("*")
                    .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String resolvedPath = Paths.get(uploadDir).toAbsolutePath().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + resolvedPath + "/");
    }
}
