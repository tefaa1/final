package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.PlayerMatchStatisticsRequest;
import com.example.trainingmatchservice.dto.response.PlayerMatchStatisticsResponse;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.service.PlayerMatchStatisticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PlayerMatchStatisticsControllerTest {

    @Mock
    private PlayerMatchStatisticsService playerMatchStatisticsService;

    @InjectMocks
    private PlayerMatchStatisticsController controller;

    private PlayerMatchStatisticsRequest request;
    private PlayerMatchStatisticsResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerMatchStatisticsRequest(
                1L, 1L, SportType.FOOTBALL,
                90, 7.5,
                // Football
                1, 0, 2, 1, 5, 3, 20, 15, 1, 2, 1, 1, 0, 1, 0, 0, 0,
                // Basketball (null)
                null, null, null, null, null, null, null, null, null, null, null, null, null,
                // Tennis (null)
                null, null, null, null, null, null, null, null, null,
                // Swimming (null)
                null, null, null, null, null, null,
                // Volleyball (null)
                null, null, null, null, null, null, null, null,
                // Handball (null)
                null, null, null, null, null, null, null, null);

        response = new PlayerMatchStatisticsResponse(
                1L, 1L, 1L, SportType.FOOTBALL,
                90, 7.5,
                // Football
                1, 0, 2, 1, 5, 3, 20, 15, 1, 2, 1, 1, 0, 1, 0, 0, 0,
                // Basketball (null)
                null, null, null, null, null, null, null, null, null, null, null, null, null,
                // Tennis (null)
                null, null, null, null, null, null, null, null, null,
                // Swimming (null)
                null, null, null, null, null, null,
                // Volleyball (null)
                null, null, null, null, null, null, null, null,
                // Handball (null)
                null, null, null, null, null, null, null, null);
    }

    @Test
    void createMatchStats_shouldReturnCreated() {
        given(playerMatchStatisticsService.createPlayerMatchStatistics(any(PlayerMatchStatisticsRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerMatchStatisticsResponse> result = controller.createMatchStats(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        assertThat(result.getBody().sportType()).isEqualTo(SportType.FOOTBALL);
        verify(playerMatchStatisticsService).createPlayerMatchStatistics(request);
    }

    @Test
    void updateMatchStats_shouldReturnOk() {
        Long id = 1L;
        given(playerMatchStatisticsService.updatePlayerMatchStatistics(eq(id), any(PlayerMatchStatisticsRequest.class)))
                .willReturn(response);

        ResponseEntity<PlayerMatchStatisticsResponse> result = controller.updateMatchStats(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerMatchStatisticsService).updatePlayerMatchStatistics(id, request);
    }

    @Test
    void getMatchStats_shouldReturnOk() {
        Long id = 1L;
        given(playerMatchStatisticsService.getPlayerMatchStatisticsById(id)).willReturn(response);

        ResponseEntity<PlayerMatchStatisticsResponse> result = controller.getMatchStats(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerMatchStatisticsService).getPlayerMatchStatisticsById(id);
    }

    @Test
    void getAllMatchStats_shouldReturnList() {
        given(playerMatchStatisticsService.getAllPlayerMatchStatistics()).willReturn(List.of(response));

        ResponseEntity<List<PlayerMatchStatisticsResponse>> result = controller.getAllMatchStats();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(playerMatchStatisticsService).getAllPlayerMatchStatistics();
    }

    @Test
    void getStatsByMatch_shouldReturnStatsForMatch() {
        Long matchId = 1L;
        given(playerMatchStatisticsService.getStatsByMatch(matchId)).willReturn(List.of(response));

        ResponseEntity<List<PlayerMatchStatisticsResponse>> result = controller.getStatsByMatch(matchId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        verify(playerMatchStatisticsService).getStatsByMatch(matchId);
    }

    @Test
    void getStatsBySportType_shouldReturnFilteredStats() {
        given(playerMatchStatisticsService.getStatsBySportType(SportType.FOOTBALL)).willReturn(List.of(response));

        ResponseEntity<List<PlayerMatchStatisticsResponse>> result = controller.getStatsBySportType(SportType.FOOTBALL);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).sportType()).isEqualTo(SportType.FOOTBALL);
        verify(playerMatchStatisticsService).getStatsBySportType(SportType.FOOTBALL);
    }

    @Test
    void deleteMatchStats_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteMatchStats(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerMatchStatisticsService).deletePlayerMatchStatistics(id);
    }
}
