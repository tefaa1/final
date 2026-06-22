package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.playerReq.PlayerRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.playerRes.PlayerResponse;
import com.example.usermanagementservice.dto.update.playerUp.PlayerStatusUpdateRequest;
import com.example.usermanagementservice.dto.update.playerUp.PlayerUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Position;
import com.example.usermanagementservice.model.enums.StatusOfPlayer;
import com.example.usermanagementservice.service.player.PlayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PlayerControllerTest {

    @Mock
    private PlayerService playerService;

    @InjectMocks
    private PlayerController controller;

    private PlayerRequest request;
    private PlayerUpdateRequest updateRequest;
    private PlayerStatusUpdateRequest statusUpdateRequest;
    private PlayerResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerRequest();
        request.setUsername("player1");
        request.setEmail("player1@example.com");
        request.setPassword("password123");
        request.setFirstName("John");
        request.setLastName("Player");
        request.setAge(25);
        request.setPhone("+1234567890");
        request.setAddress("123 Player St");
        request.setGender(Gender.MALE);
        request.setDateOfBirth(LocalDate.of(1999, 1, 1));
        request.setNationality("USA");
        request.setPreferredPosition(Position.STRIKER);
        request.setMarketValue(1000000L);
        request.setKitNumber(10);
        request.setRosterId(1L);
        request.setContractId(1L);
        request.setStatus(StatusOfPlayer.AVAILABLE);

        updateRequest = new PlayerUpdateRequest();
        updateRequest.setFirstName("John");
        updateRequest.setLastName("Player");
        updateRequest.setAge(25);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 Player St");
        updateRequest.setGender(Gender.MALE);

        statusUpdateRequest = new PlayerStatusUpdateRequest();
        statusUpdateRequest.setStatus(StatusOfPlayer.AVAILABLE);

        response = PlayerResponse.builder()
                .id(1L)
                .keycloakId("player-keycloak-1")
                .firstName("John")
                .lastName("Player")
                .age(25)
                .email("player1@example.com")
                .phone("+1234567890")
                .address("123 Player St")
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1999, 1, 1))
                .nationality("USA")
                .preferredPosition(Position.STRIKER)
                .marketValue(1000000L)
                .kitNumber(10)
                .rosterId(1L)
                .contractId(1L)
                .status(StatusOfPlayer.AVAILABLE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createPlayer_shouldReturnCreated() {
        given(playerService.createPlayer(any(PlayerRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<PlayerResponse>> result = controller.createPlayer(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(playerService).createPlayer(eq(request));
    }

    @Test
    void getPlayerById_shouldReturnOk() {
        Long id = 1L;
        given(playerService.getPlayerById(id)).willReturn(response);

        ResponseEntity<ApiResponse<PlayerResponse>> result = controller.getPlayerById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(playerService).getPlayerById(id);
    }

    @Test
    void getPlayersByStatus_shouldReturnOk() {
        StatusOfPlayer status = StatusOfPlayer.AVAILABLE;
        given(playerService.getPlayersByStatus(status)).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<PlayerResponse>>> result = controller.getPlayersByStatus(status);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(playerService).getPlayersByStatus(status);
    }

    @Test
    void updatePlayer_shouldReturnOk() {
        Long id = 1L;
        given(playerService.updatePlayer(eq(id), any(PlayerUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<PlayerResponse>> result = controller.updatePlayer(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(playerService).updatePlayer(id, updateRequest);
    }

    @Test
    void updatePlayerStatus_shouldReturnOk() {
        Long id = 1L;
        given(playerService.updatePlayerStatus(eq(id), any(PlayerStatusUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<PlayerResponse>> result = controller.updatePlayerStatus(id, statusUpdateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(playerService).updatePlayerStatus(id, statusUpdateRequest);
    }

    @Test
    void assignRoster_shouldReturnOk() {
        Long id = 1L;
        Long rosterId = 2L;
        given(playerService.assignRoster(id, rosterId)).willReturn(response);

        ResponseEntity<ApiResponse<PlayerResponse>> result = controller.assignRoster(id, rosterId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(playerService).assignRoster(id, rosterId);
    }

    @Test
    void assignContract_shouldReturnOk() {
        Long id = 1L;
        Long contractId = 3L;
        given(playerService.assignContract(id, contractId)).willReturn(response);

        ResponseEntity<ApiResponse<PlayerResponse>> result = controller.assignContract(id, contractId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(playerService).assignContract(id, contractId);
    }
}
