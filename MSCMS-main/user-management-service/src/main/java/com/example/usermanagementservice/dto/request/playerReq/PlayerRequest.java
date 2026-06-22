package com.example.usermanagementservice.dto.request.playerReq;

import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Position;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6)
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 150)
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number is invalid")
    private String phone;

    private String address;
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Nationality is required")
    private String nationality;

    @NotNull(message = "Preferred position is required")
    private Position preferredPosition;

    @Min(value = 0, message = "Market value cannot be negative")
    private Long marketValue;

    @Min(value = 1, message = "Kit number must be between 1 and 99")
    @Max(value = 99, message = "Kit number must be between 1 and 99")
    private Integer kitNumber;

    private String photoUrl;

    private Long rosterId;
    private Long contractId;

    private StatusOfPlayer status = StatusOfPlayer.AVAILABLE;
}
