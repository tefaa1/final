package com.example.trainingmatchservice.model.match.entity;

import com.example.trainingmatchservice.model.match.enums.EventType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "matches_events")
public class MatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    @Column(name = "player_keycloak_id")
    private String playerKeycloakId;
    private Long teamId;

    @Enumerated(EnumType.STRING)
    private EventType eventType;

    private Integer minute;
    private Integer extraTime;  // الوقت الإضافي (في حالة الضائع/إصابة)

    private String description;
}
