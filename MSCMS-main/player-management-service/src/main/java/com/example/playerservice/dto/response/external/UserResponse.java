package com.example.playerservice.dto.response.external;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private String role;
}
