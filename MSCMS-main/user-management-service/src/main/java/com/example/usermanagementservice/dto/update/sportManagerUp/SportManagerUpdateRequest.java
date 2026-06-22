package com.example.usermanagementservice.dto.update.sportManagerUp;


import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SportManagerUpdateRequest {
    private String firstName;
    private String lastName;
    private Integer age;
    private String phone;
    private String address;
    private Gender gender;
    private Long sportId;
    private Boolean canManageAllTeams;
}
