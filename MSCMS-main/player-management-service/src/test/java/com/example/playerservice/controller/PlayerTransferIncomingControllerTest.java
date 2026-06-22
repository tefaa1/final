package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerTransferIncomingRequest;
import com.example.playerservice.dto.response.PlayerTransferIncomingResponse;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.service.PlayerTransferIncomingService;
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
class PlayerTransferIncomingControllerTest {

    @Mock
    private PlayerTransferIncomingService playerTransferIncomingService;

    @InjectMocks
    private PlayerTransferIncomingController controller;

    private PlayerTransferIncomingRequest request;
    private PlayerTransferIncomingResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerTransferIncomingRequest(
                10L,
                20L,
                30L,
                LocalDate.now()
        );

        response = PlayerTransferIncomingResponse.builder()
                .id(1L)
                .outerPlayerId(10L)
                .fromOuterTeamId(20L)
                .toTeamId(30L)
                .status(RequestStatus.PENDING)
                .requestDate(LocalDate.now())
                .build();
    }

    @Test
    void createIncomingTransfer_shouldReturnCreated() {
        given(playerTransferIncomingService.createIncomingTransfer(any(PlayerTransferIncomingRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerTransferIncomingResponse> result = controller.createIncomingTransfer(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTransferIncomingService).createIncomingTransfer(eq(request));
    }

    @Test
    void updateIncomingTransfer_shouldReturnOk() {
        Long id = 1L;
        given(playerTransferIncomingService.updateIncomingTransfer(eq(id), any(PlayerTransferIncomingRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerTransferIncomingResponse> result = controller.updateIncomingTransfer(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTransferIncomingService).updateIncomingTransfer(id, request);
    }

    @Test
    void getIncomingTransfer_shouldReturnOk() {
        Long id = 1L;
        given(playerTransferIncomingService.getIncomingTransferById(id)).willReturn(response);

        ResponseEntity<PlayerTransferIncomingResponse> result = controller.getIncomingTransfer(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTransferIncomingService).getIncomingTransferById(id);
    }

    @Test
    void getAllIncomingTransfers_shouldReturnList() {
        given(playerTransferIncomingService.getAllIncomingTransfers()).willReturn(List.of(response));

        ResponseEntity<List<PlayerTransferIncomingResponse>> result = controller.getAllIncomingTransfers();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(playerTransferIncomingService).getAllIncomingTransfers();
    }

    @Test
    void deleteIncomingTransfer_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteIncomingTransfer(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerTransferIncomingService).deleteIncomingTransfer(id);
    }
}

