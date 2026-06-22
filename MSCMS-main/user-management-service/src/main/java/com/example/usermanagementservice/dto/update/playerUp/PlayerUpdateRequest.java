package com.example.usermanagementservice.dto.update.playerUp;


import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Position;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String nationality;
    private Position preferredPosition;
    private Long marketValue;

    @Min(value = 1, message = "Kit number must be between 1 and 99")
    @Max(value = 99, message = "Kit number must be between 1 and 99")
    private Integer kitNumber;

    private String photoUrl;
}

