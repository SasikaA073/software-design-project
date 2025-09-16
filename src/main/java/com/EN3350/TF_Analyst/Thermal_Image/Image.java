package com.EN3350.TF_Analyst.Thermal_Image;

import com.EN3350.TF_Analyst.Inspection.Inspection;
import com.EN3350.TF_Analyst.Transformer.Transformer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "images")
@Check(constraints = "(type = 'BASELINE' AND inspectionId IS NULL) OR" +
"(type = 'INSPECTION' AND inspectionId IS NOT NULL)")
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
    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ImageType type;

    public enum WeatherCondition {
        SUNNY,
        CLOUDY,
        RAINY
    }
    @Column(name = "weather", nullable = false)
    @Enumerated(EnumType.STRING)
    private WeatherCondition weatherCondition;


    @Column(name = "uploadDate",  nullable = false, columnDefinition = "DATE")
    private LocalDate uploadDate;
    @Column(name = "uploadTime",  nullable = false, columnDefinition = "TIME")
    private LocalTime uploadTime;

    @Column(name = "uploadedBy",  nullable = false, columnDefinition = "TEXT")
    private String uploadedBy;

    @ManyToOne
    @JoinColumn(
            name = "transformerId",
            nullable = false,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(
                    name = "transformer_img_fk"
            )
    )
    private Transformer transformer;

    @OneToOne
    @JoinColumn(
            name = "inspectionId",
//            nullable = true,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(
                    name = "inspection_img_fk"
            )
    )
    private Inspection inspection;

    public Image (
            String path,
            ImageType type,
            WeatherCondition weather,
            String uploadedBy
    ){
        this.path = path;
        this.type = type;
        this.weatherCondition = weather;
        this.uploadedBy = uploadedBy;
        this.uploadDate = LocalDate.now();
        this.uploadTime = LocalTime.now();
    }
}
