package com.example.usermanagementservice.dto.request.fanReq;

import com.example.usermanagementservice.model.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FanRequest {
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

    @Min(value = 1)
    @Max(value = 150)
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
    private String phone;

    private String address;
    private Gender gender;

    @NotBlank(message = "Display name is required")
    private String displayName;

    private Long favoriteTeamId;
}
