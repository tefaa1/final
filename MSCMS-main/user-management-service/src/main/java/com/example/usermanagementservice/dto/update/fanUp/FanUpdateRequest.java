package com.example.usermanagementservice.dto.update.fanUp;

import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FanUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private String displayName;
    private Long favoriteTeamId;
}