package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "seating_arrangement_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeatingArrangementStudent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seating_arrangement_room_id")
    private SeatingArrangementRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    private Integer sno;

    @Column(name = "row_num")
    private String rowNum;

    @Column(name = "bench_num")
    private String benchNum;

    @Column(name = "seat_num")
    private Integer seatNum;
}
