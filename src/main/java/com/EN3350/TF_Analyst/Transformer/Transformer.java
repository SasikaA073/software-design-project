package com.EN3350.TF_Analyst.Transformer;

//import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Data
@NoArgsConstructor
@AllArgsConstructor
//@Component
public class Transformer {

    public enum TransformerType{
        BULK,
        DISTRIBUTION
    }

    private String transformerNo;
    private String region;
    private String poleNo;
    private TransformerType type;
    private String locationDetails;
}
