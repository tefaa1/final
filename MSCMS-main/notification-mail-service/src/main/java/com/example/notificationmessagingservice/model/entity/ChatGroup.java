package com.example.notificationmessagingservice.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A real chat group. The single {@code isGeneral=true} group is the club-wide
 * team chat that every account belongs to implicitly (its members resolve to all
 * users). User-created groups have explicit membership + invitations.
 */
@Entity
@Table(name = "chat_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    private String createdByKeycloakId;

    private Boolean isGeneral;

    private LocalDateTime createdAt;
}
