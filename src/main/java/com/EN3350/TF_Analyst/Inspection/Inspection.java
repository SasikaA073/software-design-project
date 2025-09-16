package com.EN3350.TF_Analyst.Inspection;

import com.EN3350.TF_Analyst.Thermal_Image.Image;
import com.EN3350.TF_Analyst.Transformer.Transformer;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;


@Data
@NoArgsConstructor
@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "ins_seq"
    )
    @SequenceGenerator(
            name = "ins_seq",
            sequenceName = "ins_seq",
            allocationSize = 1
    )
    @Getter(AccessLevel.NONE)
//    @SequenceGenerator()
    @Column(name = "id")
    private Long id;

    @Transient
    private String inspectionNo;

    @Column(name = "branch", nullable = false, columnDefinition = "TEXT")
    private String branch;
    @Column(name = "date_of_inspection",  nullable = false, columnDefinition = "DATE")
    private LocalDate inspection_date;
    @Column(name = "time_of_inspection",  nullable = false, columnDefinition = "TIME")
    private LocalTime inspection_time;

    @ManyToOne
    @JoinColumn(
            name = "transformer_id",
            nullable = false,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(
                    name = "transformer_ins_fk"
            )
    )
    private Transformer transformer;

    @OneToOne(
            mappedBy = "inspection",
            cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
            orphanRemoval = true
    )
    private Image thermalImage;

    public Inspection(String branch) {
        this.branch = branch;
        this.inspection_date = LocalDate.now();
        this.inspection_time = LocalTime.now();
    }

    public String getInspectionNo(){
        long temp = 1000 + this.id;
        return String.valueOf(temp);
    }
}
