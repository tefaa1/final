package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerContractRequest;
import com.example.playerservice.dto.response.PlayerContractResponse;
import com.example.playerservice.service.PlayerContractService;
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
class PlayerContractControllerTest {

    @Mock
    private PlayerContractService playerContractService;

    @InjectMocks
    private PlayerContractController controller;

    private PlayerContractRequest request;
    private PlayerContractResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerContractRequest(
                "player-keycloak-10",
                LocalDate.now(),
                LocalDate.now().plusYears(3),
                100_000L,
                50_000_000L
        );

        response = PlayerContractResponse.builder()
                .id(1L)
                .playerKeycloakId("player-keycloak-10")
                .startDate(request.startDate())
                .endDate(request.endDate())
                .salary(request.salary())
                .releaseClause(request.releaseClause())
                .build();
    }

    @Test
    void createContract_shouldReturnCreated() {
        given(playerContractService.createPlayerContract(any(PlayerContractRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerContractResponse> result = controller.createContract(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerContractService).createPlayerContract(eq(request));
    }

    @Test
    void updateContract_shouldReturnOk() {
        Long id = 1L;
        given(playerContractService.updatePlayerContract(eq(id), any(PlayerContractRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerContractResponse> result = controller.updateContract(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerContractService).updatePlayerContract(id, request);
    }

    @Test
    void getContract_shouldReturnOk() {
        Long id = 1L;
        given(playerContractService.getPlayerContractById(id)).willReturn(response);

        ResponseEntity<PlayerContractResponse> result = controller.getContract(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerContractService).getPlayerContractById(id);
    }

    @Test
    void getAllContracts_shouldReturnList() {
        given(playerContractService.getAllPlayerContracts()).willReturn(List.of(response));

        ResponseEntity<List<PlayerContractResponse>> result = controller.getAllContracts();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(playerContractService).getAllPlayerContracts();
    }

    @Test
    void deleteContract_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteContract(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerContractService).deletePlayerContract(id);
    }
}

