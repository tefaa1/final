package com.example.usermanagementservice.dto.request.nationalTeamReq;

import com.example.usermanagementservice.model.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NationalTeamRequest {
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

    @NotBlank(message = "Federation name is required")
    private String federationName;

    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    @NotBlank(message = "Country is required")
    private String country;
}
