package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "seating_arrangement_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeatingArrangementRoom extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seating_arrangement_id")
    private SeatingArrangement seatingArrangement;

    @Column(name = "room_number")
    private String roomNumber;

    private Integer benches;

    @Column(name = "max_per_bench")
    private Integer maxPerBench;

    private Integer allocated;

    private String classes;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SeatingArrangementStudent> students = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "seating_arrangement_room_invigilators",
        joinColumns = @JoinColumn(name = "room_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> invigilators = new ArrayList<>();
}
