package com.example.usermanagementservice.dto.response.userRes;

import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

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
    private Gender gender;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

