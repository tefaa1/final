package com.example.trainingmatchservice.model.competition;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A user-created competition (a league season or a knockout cup). Mounted under
 * /matches/leagues so it rides the existing gateway route to this service.
 */
@Entity
@Table(name = "competitions")
@Getter
@Setter
@NoArgsConstructor
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String season;          // e.g. "2026/2027"
    private String type;            // LEAGUE | KNOCKOUT
    private Integer rounds;         // times each pair meets in a league (2 = home & away)

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (rounds == null) rounds = 2;
        if (type == null) type = "LEAGUE";
    }
}
