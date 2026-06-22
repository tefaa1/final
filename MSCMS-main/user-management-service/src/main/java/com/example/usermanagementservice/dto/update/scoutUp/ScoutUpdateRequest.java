package com.example.usermanagementservice.dto.update.scoutUp;

import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoutUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private String region;
    private String organizationName;
}