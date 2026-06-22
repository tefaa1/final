package com.example.gateway_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Email is required")
    @Email
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6)
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Min(1)
    @Max(150)
    private Integer age;

    private String phone;
    private String address;
    private String gender;

    @NotBlank(message = "Display name is required")
    private String displayName;

    private Long favoriteTeamId;
}
