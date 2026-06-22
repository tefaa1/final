package com.example.usermanagementservice.dto.request.staffReq;

import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.StaffRole;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// Base Staff Request
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffMemberRequest {
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

    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 150)
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number is invalid")
    private String phone;

    private String address;
    private Gender gender;

    @NotNull(message = "Sport ID is required")
    private Long sportId;

    @NotNull(message = "Team ID is required")
    private Long teamId;

    @NotNull(message = "Staff role is required")
    private StaffRole staffRole;

    private Long teamManagerId;

    // Specific fields based on role
    private String skillType; // For SpecificCoach
    private Integer yearsExperience; // For Physiotherapist, PerformanceAnalyst, HeadCoach
    private String toolsUsed; // For PerformanceAnalyst
    private String coachingLicenseLevel; // For HeadCoach
    private List<String> preManagedTeams; // For HeadCoach
    private String specialization; // For Doctor
    private String specialty; // For AssistantCoach
}
