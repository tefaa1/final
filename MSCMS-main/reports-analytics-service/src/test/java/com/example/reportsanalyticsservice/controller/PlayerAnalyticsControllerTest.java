package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.PlayerAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.PlayerAnalyticsResponse;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.service.PlayerAnalyticsService;
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
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlayerAnalyticsControllerTest {

    @Mock
    private PlayerAnalyticsService playerAnalyticsService;

    @InjectMocks
    private PlayerAnalyticsController playerAnalyticsController;

    private PlayerAnalyticsRequest request;
    private PlayerAnalyticsResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerAnalyticsRequest(
                "player-keycloak-id-1",
                1L,
                SportType.FOOTBALL,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31),
                25,
                10,
                5,
                7.5,
                80,
                95,
                2,
                85.5,
                10,
                "{\"goals\":10}",
                "{\"dribbles\":50}",
                "Improving",
                LocalDateTime.of(2025, 1, 15, 10, 0),
                "Good analytics"
        );

        response = new PlayerAnalyticsResponse(
                1L,
                "player-keycloak-id-1",
                1L,
                SportType.FOOTBALL,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31),
                25,
                10,
                5,
                7.5,
                80,
                95,
                2,
                85.5,
                10,
                "{\"goals\":10}",
                "{\"dribbles\":50}",
                "Improving",
                LocalDateTime.of(2025, 1, 15, 10, 0),
                "Good analytics"
        );
    }

    @Test
    void testCreatePlayerAnalytics() {
        given(playerAnalyticsService.create(request)).willReturn(response);

        ResponseEntity<PlayerAnalyticsResponse> result = playerAnalyticsController.create(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().playerKeycloakId()).isEqualTo("player-keycloak-id-1");
        assertThat(result.getBody().sportType()).isEqualTo(SportType.FOOTBALL);
        verify(playerAnalyticsService).create(request);
    }

    @Test
    void testUpdatePlayerAnalytics() {
        given(playerAnalyticsService.update(1L, request)).willReturn(response);

        ResponseEntity<PlayerAnalyticsResponse> result = playerAnalyticsController.update(1L, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().totalMatches()).isEqualTo(25);
        assertThat(result.getBody().primaryScore()).isEqualTo(10);
        verify(playerAnalyticsService).update(1L, request);
    }

    @Test
    void testGetPlayerAnalyticsById() {
        given(playerAnalyticsService.getById(1L)).willReturn(response);

        ResponseEntity<PlayerAnalyticsResponse> result = playerAnalyticsController.getById(1L);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        verify(playerAnalyticsService).getById(1L);
    }

    @Test
    void testGetAllPlayerAnalytics() {
        given(playerAnalyticsService.getAll()).willReturn(List.of(response));

        ResponseEntity<List<PlayerAnalyticsResponse>> result = playerAnalyticsController.getAll();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        verify(playerAnalyticsService).getAll();
    }

    @Test
    void testGetPlayerAnalyticsBySportType() {
        given(playerAnalyticsService.getBySportType(SportType.FOOTBALL)).willReturn(List.of(response));

        ResponseEntity<List<PlayerAnalyticsResponse>> result = playerAnalyticsController.getBySportType(SportType.FOOTBALL);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).sportType()).isEqualTo(SportType.FOOTBALL);
        verify(playerAnalyticsService).getBySportType(SportType.FOOTBALL);
    }

    @Test
    void testDeletePlayerAnalytics() {
        doNothing().when(playerAnalyticsService).delete(1L);

        ResponseEntity<Void> result = playerAnalyticsController.delete(1L);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerAnalyticsService).delete(1L);
    }
}
