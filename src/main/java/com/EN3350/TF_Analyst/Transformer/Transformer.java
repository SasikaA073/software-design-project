package com.EN3350.TF_Analyst.Transformer;

import jakarta.persistence.*;
import lombok.*;


@Data
@NoArgsConstructor
//@AllArgsConstructor
@Entity
@Table(name = "transformers")
public class Transformer {

    @Id
    @Getter(AccessLevel.NONE)
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "tf_seq"
    )
    @SequenceGenerator(
            name = "tf_seq",
            sequenceName = "tf_seq",
            allocationSize = 1
    )
    private Long id;

    public enum TransformerType{
        BULK,
        DISTRIBUTION
    }

    @Transient
    private String transformerNo;
    private String region;
    private String poleNo;

    @Enumerated(EnumType.STRING)
    private TransformerType type;
    private String locationDetails;

    public String getTransformerNo() {
        return "AZ-" + (10000 + id);
    }


    public Transformer(String region, String poleNo, TransformerType type, String locationDetails) {
        this.region = region;
        this.poleNo = poleNo;
        this.type = type;
        this.locationDetails = locationDetails;
    }
}


