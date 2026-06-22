package com.example.usermanagementservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDeletedEvent {
    private Long userId;
    private String keycloakId;
    private String role;
    private Instant timestamp;
}
