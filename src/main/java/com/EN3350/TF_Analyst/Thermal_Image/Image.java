package com.EN3350.TF_Analyst.Thermal_Image;

import com.EN3350.TF_Analyst.Inspection.Inspection;
import com.EN3350.TF_Analyst.Transformer.Transformer;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "images")
@EntityListeners(ImageEntityListener.class)
public class Image {

    @Id
    @Getter(AccessLevel.NONE)
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "im_seq"
    )
    @SequenceGenerator(
            name = "im_seq",
            sequenceName = "im_seq",
            allocationSize = 1
    )
    private Long id;

    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String path;

    public enum ImageType {
        BASELINE,
        INSPECTION
    }
    @Column(name = "type", nullable = false, columnDefinition = "ENUMERATOR")
    private ImageType type;

    public enum WeatherCondition {
        SUNNY,
        CLOUDY,
        RAINY
    }
    @Column(name = "weather", nullable = false, columnDefinition = "ENUMERATOR")
    private WeatherCondition weatherCondition;


    @Column(name = "upload_date",  nullable = false, columnDefinition = "DATE")
    private LocalDate upload_date;
    @Column(name = "upload_time",  nullable = false, columnDefinition = "TIME")
    private LocalTime upload_time;

    @Column(name = "uploaded_by",  nullable = false, columnDefinition = "TEXT")
    private String uploaded_by;

    @ManyToOne
    @JoinColumn(
            name = "transformer_id",
            nullable = false,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(
                    name = "transformer_img_fk"
            )
    )
    private Transformer transformer;

    @OneToOne
    @JoinColumn(
            name = "ins_id",
//            nullable = true,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(
                    name = "inspection_img_fk"
            )
    )
    private Inspection inspection;

}
