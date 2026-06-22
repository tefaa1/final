package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerTransferOutgoingRequest;
import com.example.playerservice.dto.response.PlayerTransferOutgoingResponse;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.service.PlayerTransferOutgoingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PlayerTransferOutgoingControllerTest {

    @Mock
    private PlayerTransferOutgoingService playerTransferOutgoingService;

    @InjectMocks
    private PlayerTransferOutgoingController controller;

    private PlayerTransferOutgoingRequest request;
    private PlayerTransferOutgoingResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerTransferOutgoingRequest(
                "player-keycloak-10",
                20L,
                30L,
                LocalDate.now()
        );

        response = PlayerTransferOutgoingResponse.builder()
                .id(1L)
                .playerKeycloakId("player-keycloak-10")
                .fromTeamId(20L)
                .toOuterTeamId(30L)
                .status(RequestStatus.PENDING)
                .requestDate(LocalDate.now())
                .build();
    }

    @Test
    void createOutgoingTransfer_shouldReturnCreated() {
        given(playerTransferOutgoingService.createOutgoingTransfer(any(PlayerTransferOutgoingRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerTransferOutgoingResponse> result = controller.createOutgoingTransfer(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTransferOutgoingService).createOutgoingTransfer(eq(request));
    }

    @Test
    void updateOutgoingTransfer_shouldReturnOk() {
        Long id = 1L;
        given(playerTransferOutgoingService.updateOutgoingTransfer(eq(id), any(PlayerTransferOutgoingRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerTransferOutgoingResponse> result = controller.updateOutgoingTransfer(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTransferOutgoingService).updateOutgoingTransfer(id, request);
    }

    @Test
    void getOutgoingTransfer_shouldReturnOk() {
        Long id = 1L;
        given(playerTransferOutgoingService.getOutgoingTransferById(id)).willReturn(response);

        ResponseEntity<PlayerTransferOutgoingResponse> result = controller.getOutgoingTransfer(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTransferOutgoingService).getOutgoingTransferById(id);
    }

    @Test
    void getAllOutgoingTransfers_shouldReturnList() {
        given(playerTransferOutgoingService.getAllOutgoingTransfers()).willReturn(List.of(response));

        ResponseEntity<List<PlayerTransferOutgoingResponse>> result = controller.getAllOutgoingTransfers();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(playerTransferOutgoingService).getAllOutgoingTransfers();
    }

    @Test
    void deleteOutgoingTransfer_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteOutgoingTransfer(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerTransferOutgoingService).deleteOutgoingTransfer(id);
    }
}

