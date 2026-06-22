package com.example.notificationmessagingservice.model.entity;

import com.example.notificationmessagingservice.model.enums.GroupMemberStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One user's membership (or pending invitation) in a {@link ChatGroup}. */
@Entity
@Table(name = "chat_group_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long groupId;

    private String userKeycloakId;

    @Enumerated(EnumType.STRING)
    private GroupMemberStatus status;

    private String invitedByKeycloakId;

    private LocalDateTime createdAt;
}
