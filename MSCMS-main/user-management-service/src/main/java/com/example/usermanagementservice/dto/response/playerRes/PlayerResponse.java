package com.example.usermanagementservice.dto.response.playerRes;

import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Position;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerResponse {
    private Long id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String nationality;
    private Position preferredPosition;
    private Long marketValue;
    private Integer kitNumber;
    private String photoUrl;
    private Long rosterId;
    private Long contractId;
    private StatusOfPlayer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

