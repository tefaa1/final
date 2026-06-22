package com.example.playerservice.model.entity;

import com.example.playerservice.model.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "player_transfer_incoming")
public class PlayerTransferIncoming {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "outer_player_id")
    private OuterPlayer outerPlayer;

    @ManyToOne
    @JoinColumn(name = "from_team_id")
    private OuterTeam fromTeam;

    @ManyToOne
    @JoinColumn(name = "to_team_id")
    private Team toTeam;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDate requestDate;
}
