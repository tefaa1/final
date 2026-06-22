package com.example.usermanagementservice.dto.request.userReq;


import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Role;
import jakarta.validation.constraints.*;
import lombok.*;

// Base User Request DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 150, message = "Age must not exceed 150")
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number is invalid")
    private String phone;

    private String address;

    private Gender gender;

    @NotNull(message = "Role is required")
    private Role role;

    // Additional fields for staff members
    private String specialization;
    private Integer experience_years;
    private String bloodType; // For medical staff if needed
}

