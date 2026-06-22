package com.example.notificationmessagingservice.model.entity;

import com.example.notificationmessagingservice.model.enums.MessageStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderUserKeycloakId; // Reference to User (Keycloak ID - Coach, Doctor, etc.)
    private String recipientUserKeycloakId; // Reference to User (Keycloak ID)

    private String subject;
    private String content;

    private Long groupId; // null = direct message; set = belongs to a ChatGroup

    @Enumerated(EnumType.STRING)
    private MessageStatus status;

    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;

    @OneToMany(mappedBy = "parentMessage", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Message> replies = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "parent_message_id")
    private Message parentMessage; // For message threads
}
