package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.MatchAnalysisRequest;
import com.example.reportsanalyticsservice.dto.response.MatchAnalysisResponse;
import com.example.reportsanalyticsservice.model.enums.SportType;
import com.example.reportsanalyticsservice.service.MatchAnalysisService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchAnalysisControllerTest {

    @Mock
    private MatchAnalysisService matchAnalysisService;

    @InjectMocks
    private MatchAnalysisController matchAnalysisController;

    @Test
    void testCreateMatchAnalysis() {
        MatchAnalysisRequest request = new MatchAnalysisRequest(
                1L, 1L, SportType.FOOTBALL,
                "{\"possession\":55,\"shots\":12}",
                "heatmap/team1/match1.png", "POSSESSION",
                "Key moments data", "Tactical analysis data", "Player ratings data",
                "analyst-keycloak-id-1", LocalDateTime.of(2025, 1, 15, 10, 0),
                "Good match analysis", null
        );

        MatchAnalysisResponse response = new MatchAnalysisResponse(
                1L, 1L, 1L, SportType.FOOTBALL,
                "{\"possession\":55,\"shots\":12}",
                "heatmap/team1/match1.png", "POSSESSION",
                "Key moments data", "Tactical analysis data", "Player ratings data",
                "analyst-keycloak-id-1", LocalDateTime.of(2025, 1, 15, 10, 0),
                "Good match analysis", null
        );

        given(matchAnalysisService.create(request)).willReturn(response);

        ResponseEntity<MatchAnalysisResponse> result = matchAnalysisController.create(request);

        assertThat(result.getStatusCodeValue()).isEqualTo(201);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().matchId()).isEqualTo(1L);
        assertThat(result.getBody().sportType()).isEqualTo(SportType.FOOTBALL);
        assertThat(result.getBody().analyzedByUserKeycloakId()).isEqualTo("analyst-keycloak-id-1");
        verify(matchAnalysisService, times(1)).create(request);
    }

    @Test
    void testUpdateMatchAnalysis() {
        Long id = 1L;
        MatchAnalysisRequest request = new MatchAnalysisRequest(
                1L, 1L, SportType.BASKETBALL,
                "{\"fieldGoalPct\":0.48,\"rebounds\":45}",
                "heatmap/team1/match1_updated.png", "SHOTS",
                "Updated key moments", "Updated tactical analysis", "Updated player ratings",
                "analyst-keycloak-id-1", LocalDateTime.of(2025, 1, 16, 10, 0),
                "Updated match analysis", null
        );

        MatchAnalysisResponse response = new MatchAnalysisResponse(
                1L, 1L, 1L, SportType.BASKETBALL,
                "{\"fieldGoalPct\":0.48,\"rebounds\":45}",
                "heatmap/team1/match1_updated.png", "SHOTS",
                "Updated key moments", "Updated tactical analysis", "Updated player ratings",
                "analyst-keycloak-id-1", LocalDateTime.of(2025, 1, 16, 10, 0),
                "Updated match analysis", null
        );

        given(matchAnalysisService.update(id, request)).willReturn(response);

        ResponseEntity<MatchAnalysisResponse> result = matchAnalysisController.update(id, request);

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().sportType()).isEqualTo(SportType.BASKETBALL);
        verify(matchAnalysisService, times(1)).update(id, request);
    }

    @Test
    void testGetMatchAnalysisById() {
        Long id = 1L;
        MatchAnalysisResponse response = new MatchAnalysisResponse(
                1L, 1L, 1L, SportType.FOOTBALL,
                "{\"possession\":55,\"shots\":12}",
                "heatmap/team1/match1.png", "POSSESSION",
                "Key moments data", "Tactical analysis data", "Player ratings data",
                "analyst-keycloak-id-1", LocalDateTime.of(2025, 1, 15, 10, 0),
                "Good match analysis", null
        );

        given(matchAnalysisService.getById(id)).willReturn(response);

        ResponseEntity<MatchAnalysisResponse> result = matchAnalysisController.getById(id);

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        verify(matchAnalysisService, times(1)).getById(id);
    }

    @Test
    void testGetAllMatchAnalyses() {
        MatchAnalysisResponse response1 = new MatchAnalysisResponse(
                1L, 1L, 1L, SportType.FOOTBALL, "{\"possession\":55}",
                "heatmap/team1/match1.png", "POSSESSION",
                "Key moments", "Tactical analysis", "Player ratings",
                "analyst-1", LocalDateTime.of(2025, 1, 15, 10, 0), "Analysis 1", null
        );

        MatchAnalysisResponse response2 = new MatchAnalysisResponse(
                2L, 2L, 2L, SportType.BASKETBALL, "{\"fieldGoalPct\":0.48}",
                "heatmap/team2/match2.png", "SHOTS",
                "Key moments 2", "Tactical analysis 2", "Player ratings 2",
                "analyst-2", LocalDateTime.of(2025, 1, 20, 10, 0), "Analysis 2", null
        );

        List<MatchAnalysisResponse> responses = Arrays.asList(response1, response2);
        given(matchAnalysisService.getAll()).willReturn(responses);

        ResponseEntity<List<MatchAnalysisResponse>> result = matchAnalysisController.getAll();

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody()).hasSize(2);
        verify(matchAnalysisService, times(1)).getAll();
    }

    @Test
    void testGetMatchAnalysisBySportType() {
        MatchAnalysisResponse response = new MatchAnalysisResponse(
                1L, 1L, 1L, SportType.FOOTBALL, "{\"possession\":55}",
                "heatmap/team1/match1.png", "POSSESSION",
                "Key moments", "Tactical analysis", "Player ratings",
                "analyst-1", LocalDateTime.of(2025, 1, 15, 10, 0), "Analysis 1", null
        );

        given(matchAnalysisService.getBySportType(SportType.FOOTBALL)).willReturn(List.of(response));

        ResponseEntity<List<MatchAnalysisResponse>> result = matchAnalysisController.getBySportType(SportType.FOOTBALL);

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).sportType()).isEqualTo(SportType.FOOTBALL);
        verify(matchAnalysisService, times(1)).getBySportType(SportType.FOOTBALL);
    }

    @Test
    void testDeleteMatchAnalysis() {
        Long id = 1L;
        doNothing().when(matchAnalysisService).delete(id);

        ResponseEntity<Void> result = matchAnalysisController.delete(id);

        assertThat(result.getStatusCodeValue()).isEqualTo(204);
        verify(matchAnalysisService, times(1)).delete(id);
    }
}
