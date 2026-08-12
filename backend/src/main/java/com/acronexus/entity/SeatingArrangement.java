package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "seating_arrangements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeatingArrangement extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", unique = true)
    private Examination examination;

    @Column(name = "total_students")
    private Integer totalStudents;

    @Column(name = "rooms_utilized")
    private Integer roomsUtilized;

    @Column(name = "total_capacity")
    private Integer totalCapacity;

    @OneToMany(mappedBy = "seatingArrangement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SeatingArrangementRoom> roomAllocations = new ArrayList<>();

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
