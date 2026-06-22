package com.example.usermanagementservice.dto.response.scoutRes;


import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoutResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String region;
    private String organizationName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}