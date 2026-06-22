package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.TeamAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TeamAnalyticsResponse;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.service.TeamAnalyticsService;
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
class TeamAnalyticsControllerTest {

    @Mock
    private TeamAnalyticsService teamAnalyticsService;

    @InjectMocks
    private TeamAnalyticsController teamAnalyticsController;

    private TeamAnalyticsRequest request;
    private TeamAnalyticsResponse response;

    @BeforeEach
    void setUp() {
        request = new TeamAnalyticsRequest(
                1L,
                SportType.FOOTBALL,
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2026, 5, 31),
                38,
                25,
                8,
                5,
                75,
                30,
                85.0,
                15,
                120,
                "{\"avgPossession\":55.0}",
                "{\"pressureSuccessRate\":0.68}",
                "Strong attack and midfield",
                LocalDateTime.of(2025, 6, 1, 10, 0),
                "Good team performance"
        );

        response = new TeamAnalyticsResponse(
                1L,
                1L,
                SportType.FOOTBALL,
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2026, 5, 31),
                38,
                25,
                8,
                5,
                75,
                30,
                85.0,
                15,
                120,
                "{\"avgPossession\":55.0}",
                "{\"pressureSuccessRate\":0.68}",
                "Strong attack and midfield",
                LocalDateTime.of(2025, 6, 1, 10, 0),
                "Good team performance"
        );
    }

    @Test
    void testCreateTeamAnalytics() {
        given(teamAnalyticsService.create(request)).willReturn(response);

        ResponseEntity<TeamAnalyticsResponse> result = teamAnalyticsController.create(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().teamId()).isEqualTo(1L);
        assertThat(result.getBody().sportType()).isEqualTo(SportType.FOOTBALL);
        assertThat(result.getBody().totalMatches()).isEqualTo(38);
        verify(teamAnalyticsService).create(request);
    }

    @Test
    void testUpdateTeamAnalytics() {
        given(teamAnalyticsService.update(1L, request)).willReturn(response);

        ResponseEntity<TeamAnalyticsResponse> result = teamAnalyticsController.update(1L, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().wins()).isEqualTo(25);
        assertThat(result.getBody().pointsFor()).isEqualTo(75);
        verify(teamAnalyticsService).update(1L, request);
    }

    @Test
    void testGetTeamAnalyticsById() {
        given(teamAnalyticsService.getById(1L)).willReturn(response);

        ResponseEntity<TeamAnalyticsResponse> result = teamAnalyticsController.getById(1L);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        verify(teamAnalyticsService).getById(1L);
    }

    @Test
    void testGetAllTeamAnalytics() {
        given(teamAnalyticsService.getAll()).willReturn(List.of(response));

        ResponseEntity<List<TeamAnalyticsResponse>> result = teamAnalyticsController.getAll();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        verify(teamAnalyticsService).getAll();
    }

    @Test
    void testGetTeamAnalyticsBySportType() {
        given(teamAnalyticsService.getBySportType(SportType.FOOTBALL)).willReturn(List.of(response));

        ResponseEntity<List<TeamAnalyticsResponse>> result = teamAnalyticsController.getBySportType(SportType.FOOTBALL);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).sportType()).isEqualTo(SportType.FOOTBALL);
        verify(teamAnalyticsService).getBySportType(SportType.FOOTBALL);
    }

    @Test
    void testDeleteTeamAnalytics() {
        doNothing().when(teamAnalyticsService).delete(1L);

        ResponseEntity<Void> result = teamAnalyticsController.delete(1L);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(teamAnalyticsService).delete(1L);
    }
}
