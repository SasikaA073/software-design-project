package com.EN3350.TF_Analyst.Inspection;

import com.EN3350.TF_Analyst.Transformer.Transformer;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;

@Data
@NoArgsConstructor
@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
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



    public Inspection(String branch, LocalDate inspection_date, LocalTime inspection_time) {
        this.branch = branch;
        this.inspection_date = inspection_date;
        this.inspection_time = inspection_time;
    }

    public void setInspectionNo(){
        long temp = 1000 + this.id;
        this.inspectionNo = String.valueOf(temp);
    }
}
