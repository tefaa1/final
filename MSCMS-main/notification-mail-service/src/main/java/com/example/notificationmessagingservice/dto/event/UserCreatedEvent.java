package com.example.notificationmessagingservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreatedEvent {
    private Long userId;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private Instant timestamp;
}
