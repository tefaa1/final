package com.example.usermanagementservice.dto.response.nationalTeamReS;
import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NationalTeamResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String federationName;
    private String contactPerson;
    private String country;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}