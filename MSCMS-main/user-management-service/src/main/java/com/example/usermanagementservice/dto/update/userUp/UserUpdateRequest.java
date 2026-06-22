package com.example.usermanagementservice.dto.update.userUp;

import com.example.usermanagementservice.model.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Email(message = "Email should be valid")
    private String email;

    private String firstName;
    private String lastName;

    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 150, message = "Age must not exceed 150")
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number is invalid")
    private String phone;

    private String address;
    private Gender gender;
}
