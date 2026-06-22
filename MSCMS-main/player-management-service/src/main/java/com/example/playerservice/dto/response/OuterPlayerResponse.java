package com.example.playerservice.dto.response;

import com.example.playerservice.model.enums.Position;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OuterPlayerResponse {
    private Long id;
    private LocalDate dateOfBirth;
    private String nationality;
    private Position preferredPosition;
    private Long marketValue;
    private Integer kitNumber;
    private Long outerTeamId;
}

