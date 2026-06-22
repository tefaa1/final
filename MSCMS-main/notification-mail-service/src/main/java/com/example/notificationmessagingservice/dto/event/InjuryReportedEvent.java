package com.example.notificationmessagingservice.dto.event;

import lombok.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InjuryReportedEvent {
    private Long injuryId;
    private String playerKeycloakId;
    private Long teamId;
    private String injuryType;
    private String severity;
    private String bodyPart;
    private String reportedByDoctorKeycloakId;
    private Instant timestamp;
}
