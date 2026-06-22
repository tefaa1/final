package com.example.playerservice.dto.response;

import com.example.playerservice.model.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerTransferIncomingResponse {
    private Long id;
    private Long outerPlayerId;
    private Long fromOuterTeamId;
    private Long toTeamId;
    private RequestStatus status;
    private LocalDate requestDate;
}

