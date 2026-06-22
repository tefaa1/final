package com.example.usermanagementservice.dto.response.sponsorRes;

import com.example.usermanagementservice.model.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SponsorResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String companyName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
