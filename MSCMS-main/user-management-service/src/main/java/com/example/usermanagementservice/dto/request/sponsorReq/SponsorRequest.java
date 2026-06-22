package com.example.usermanagementservice.dto.request.sponsorReq;
import com.example.usermanagementservice.model.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SponsorRequest {
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

    @Min(value = 18)
    @Max(value = 150)
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
    private String phone;

    private String address;
    private Gender gender;

    @NotBlank(message = "Company name is required")
    private String companyName;
}