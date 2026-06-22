package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.TrainingAnalyticsRequest;
import com.example.reportsanalyticsservice.dto.response.TrainingAnalyticsResponse;
import com.example.reportsanalyticsservice.service.TrainingAnalyticsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrainingAnalyticsControllerTest {

    @Mock
    private TrainingAnalyticsService trainingAnalyticsService;

    @InjectMocks
    private TrainingAnalyticsController trainingAnalyticsController;

    @Test
    void testCreateTrainingAnalytics() {
        // Given
        TrainingAnalyticsRequest request = new TrainingAnalyticsRequest(
                1L,
                "analyst-keycloak-id-1",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                150,
                138,
                12,
                92.0,
                7.5,
                8.2,
                3,
                "KPI data",
                "Overall improvement observed",
                LocalDateTime.of(2025, 11, 1, 10, 0),
                "Good training analytics"
        );

        TrainingAnalyticsResponse response = new TrainingAnalyticsResponse(
                1L,
                1L,
                "analyst-keycloak-id-1",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                150,
                138,
                12,
                92.0,
                7.5,
                8.2,
                3,
                "KPI data",
                "Overall improvement observed",
                LocalDateTime.of(2025, 11, 1, 10, 0),
                "Good training analytics"
        );

        given(trainingAnalyticsService.create(request)).willReturn(response);

        // When
        ResponseEntity<TrainingAnalyticsResponse> result = trainingAnalyticsController.create(request);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(201);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().teamId()).isEqualTo(1L);
        assertThat(result.getBody().totalSessions()).isEqualTo(150);
        verify(trainingAnalyticsService, times(1)).create(request);
    }

    @Test
    void testUpdateTrainingAnalytics() {
        // Given
        Long id = 1L;
        TrainingAnalyticsRequest request = new TrainingAnalyticsRequest(
                1L,
                "analyst-keycloak-id-1",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                160,
                150,
                10,
                93.75,
                7.8,
                8.5,
                2,
                "Updated KPI data",
                "Significant improvement in technical skills",
                LocalDateTime.of(2025, 11, 2, 10, 0),
                "Updated training analytics"
        );

        TrainingAnalyticsResponse response = new TrainingAnalyticsResponse(
                1L,
                1L,
                "analyst-keycloak-id-1",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                160,
                150,
                10,
                93.75,
                7.8,
                8.5,
                2,
                "Updated KPI data",
                "Significant improvement in technical skills",
                LocalDateTime.of(2025, 11, 2, 10, 0),
                "Updated training analytics"
        );

        given(trainingAnalyticsService.update(id, request)).willReturn(response);

        // When
        ResponseEntity<TrainingAnalyticsResponse> result = trainingAnalyticsController.update(id, request);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().totalSessions()).isEqualTo(160);
        verify(trainingAnalyticsService, times(1)).update(id, request);
    }

    @Test
    void testGetTrainingAnalyticsById() {
        // Given
        Long id = 1L;
        TrainingAnalyticsResponse response = new TrainingAnalyticsResponse(
                1L,
                1L,
                "analyst-keycloak-id-1",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                150,
                138,
                12,
                92.0,
                7.5,
                8.2,
                3,
                "KPI data",
                "Overall improvement observed",
                LocalDateTime.of(2025, 11, 1, 10, 0),
                "Good training analytics"
        );

        given(trainingAnalyticsService.getById(id)).willReturn(response);

        // When
        ResponseEntity<TrainingAnalyticsResponse> result = trainingAnalyticsController.getById(id);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        verify(trainingAnalyticsService, times(1)).getById(id);
    }

    @Test
    void testGetAllTrainingAnalytics() {
        // Given
        TrainingAnalyticsResponse response1 = new TrainingAnalyticsResponse(
                1L,
                1L,
                "analyst-keycloak-id-1",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                150,
                138,
                12,
                92.0,
                7.5,
                8.2,
                3,
                "KPI data",
                "Overall improvement observed",
                LocalDateTime.of(2025, 11, 1, 10, 0),
                "Good training analytics"
        );

        TrainingAnalyticsResponse response2 = new TrainingAnalyticsResponse(
                2L,
                2L,
                "analyst-keycloak-id-2",
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 10, 31),
                140,
                125,
                15,
                89.29,
                7.2,
                7.8,
                5,
                "KPI data 2",
                "Moderate improvement",
                LocalDateTime.of(2025, 11, 1, 10, 0),
                "Moderate training analytics"
        );

        List<TrainingAnalyticsResponse> responses = Arrays.asList(response1, response2);
        given(trainingAnalyticsService.getAll()).willReturn(responses);

        // When
        ResponseEntity<List<TrainingAnalyticsResponse>> result = trainingAnalyticsController.getAll();

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody()).hasSize(2);
        verify(trainingAnalyticsService, times(1)).getAll();
    }

    @Test
    void testDeleteTrainingAnalytics() {
        // Given
        Long id = 1L;
        doNothing().when(trainingAnalyticsService).delete(id);

        // When
        ResponseEntity<Void> result = trainingAnalyticsController.delete(id);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(204);
        verify(trainingAnalyticsService, times(1)).delete(id);
    }
}
