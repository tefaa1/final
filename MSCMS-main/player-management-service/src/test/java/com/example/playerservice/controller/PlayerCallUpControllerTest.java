package com.example.playerservice.controller;

import com.example.playerservice.dto.request.PlayerCallUpRequestCreate;
import com.example.playerservice.dto.response.PlayerCallUpResponse;
import com.example.playerservice.model.enums.RequestStatus;
import com.example.playerservice.service.PlayerCallUpRequestService;
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
class PlayerCallUpControllerTest {

    @Mock
    private PlayerCallUpRequestService playerCallUpRequestService;

    @InjectMocks
    private PlayerCallUpController controller;

    private PlayerCallUpRequestCreate request;
    private PlayerCallUpResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerCallUpRequestCreate(
                "player-keycloak-10",
                "national-team-keycloak-100",
                LocalDate.now()
        );

        response = PlayerCallUpResponse.builder()
                .id(1L)
                .playerKeycloakId("player-keycloak-10")
                .nationalTeamKeycloakId("national-team-keycloak-100")
                .status(RequestStatus.PENDING)
                .requestDate(LocalDate.now())
                .build();
    }

    @Test
    void createCallUp_shouldReturnCreated() {
        given(playerCallUpRequestService.createCallUpRequest(any(PlayerCallUpRequestCreate.class)))
                .willReturn(response);

        ResponseEntity<PlayerCallUpResponse> result = controller.createCallUp(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerCallUpRequestService).createCallUpRequest(eq(request));
    }

    @Test
    void updateCallUp_shouldReturnOk() {
        Long id = 1L;
        given(playerCallUpRequestService.updateCallUpRequest(eq(id), any(PlayerCallUpRequestCreate.class)))
                .willReturn(response);

        ResponseEntity<PlayerCallUpResponse> result = controller.updateCallUp(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerCallUpRequestService).updateCallUpRequest(id, request);
    }

    @Test
    void getCallUp_shouldReturnOk() {
        Long id = 1L;
        given(playerCallUpRequestService.getCallUpRequestById(id)).willReturn(response);

        ResponseEntity<PlayerCallUpResponse> result = controller.getCallUp(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerCallUpRequestService).getCallUpRequestById(id);
    }

    @Test
    void getAllCallUps_shouldReturnList() {
        given(playerCallUpRequestService.getAllCallUpRequests()).willReturn(List.of(response));

        ResponseEntity<List<PlayerCallUpResponse>> result = controller.getAllCallUps();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(playerCallUpRequestService).getAllCallUpRequests();
    }

    @Test
    void deleteCallUp_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteCallUp(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerCallUpRequestService).deleteCallUpRequest(id);
    }
}

