package com.example.usermanagementservice.dto.response.staffRes;


import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.StaffRole;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class StaffMemberResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private Long sportId;
    private Long teamId;
    private StaffRole staffRole;
    private Long teamManagerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
