package com.example.reportsanalyticsservice.dto.response.external;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamResponse {
    private Long id;
    private String name;
    private String country;
    private Long sportId;
}
