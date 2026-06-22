package com.example.usermanagementservice.dto.response.teamManagerRes;


import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamManagerResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private Long teamId;
    private Long sportManagerId;
    private Boolean canManageAllStaffMembers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
