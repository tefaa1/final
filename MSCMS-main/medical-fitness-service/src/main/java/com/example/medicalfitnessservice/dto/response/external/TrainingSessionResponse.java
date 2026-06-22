package com.example.medicalfitnessservice.dto.response.external;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingSessionResponse {
    private Long id;
    private Long teamId;
    private String trainingType;
    private String status;
    private LocalDateTime scheduledDateTime;
    private Integer durationMinutes;
    private String location;
}
