package com.example.usermanagementservice.dto.response.sportMangerRes;


import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportManagerResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private Long sportId;
    private Boolean canManageAllTeams;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
