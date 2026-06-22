package com.example.reportsanalyticsservice.controller;

import com.example.reportsanalyticsservice.dto.request.ScoutReportRequest;
import com.example.reportsanalyticsservice.dto.response.ScoutReportResponse;
import com.example.reportsanalyticsservice.service.ScoutReportService;
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
class ScoutReportControllerTest {

    @Mock
    private ScoutReportService scoutReportService;

    @InjectMocks
    private ScoutReportController scoutReportController;

    @Test
    void testCreateScoutReport() {
        // Given
        ScoutReportRequest request = new ScoutReportRequest(
                "scout-keycloak-id-1",
                100L,
                8,
                7,
                9,
                7,
                "Excellent pace and finishing",
                "Needs to improve heading",
                "Highly recommended",
                true,
                LocalDateTime.of(2025, 1, 15, 10, 0)
        );

        ScoutReportResponse response = new ScoutReportResponse(
                1L,
                "scout-keycloak-id-1",
                100L,
                8,
                7,
                9,
                7,
                "Excellent pace and finishing",
                "Needs to improve heading",
                "Highly recommended",
                true,
                LocalDateTime.of(2025, 1, 15, 10, 0)
        );

        given(scoutReportService.create(request)).willReturn(response);

        // When
        ResponseEntity<ScoutReportResponse> result = scoutReportController.create(request);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(201);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().scoutKeycloakId()).isEqualTo("scout-keycloak-id-1");
        assertThat(result.getBody().outerPlayerId()).isEqualTo(100L);
        verify(scoutReportService, times(1)).create(request);
    }

    @Test
    void testUpdateScoutReport() {
        // Given
        Long id = 1L;
        ScoutReportRequest request = new ScoutReportRequest(
                "scout-keycloak-id-1",
                100L,
                9,
                8,
                9,
                8,
                "Outstanding pace and finishing",
                "Heading improved significantly",
                "Strongly recommended",
                true,
                LocalDateTime.of(2025, 1, 16, 10, 0)
        );

        ScoutReportResponse response = new ScoutReportResponse(
                1L,
                "scout-keycloak-id-1",
                100L,
                9,
                8,
                9,
                8,
                "Outstanding pace and finishing",
                "Heading improved significantly",
                "Strongly recommended",
                true,
                LocalDateTime.of(2025, 1, 16, 10, 0)
        );

        given(scoutReportService.update(id, request)).willReturn(response);

        // When
        ResponseEntity<ScoutReportResponse> result = scoutReportController.update(id, request);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        assertThat(result.getBody().technicalRating()).isEqualTo(9);
        verify(scoutReportService, times(1)).update(id, request);
    }

    @Test
    void testGetScoutReportById() {
        // Given
        Long id = 1L;
        ScoutReportResponse response = new ScoutReportResponse(
                1L,
                "scout-keycloak-id-1",
                100L,
                8,
                7,
                9,
                7,
                "Excellent pace and finishing",
                "Needs to improve heading",
                "Highly recommended",
                true,
                LocalDateTime.of(2025, 1, 15, 10, 0)
        );

        given(scoutReportService.getById(id)).willReturn(response);

        // When
        ResponseEntity<ScoutReportResponse> result = scoutReportController.getById(id);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().id()).isEqualTo(1L);
        verify(scoutReportService, times(1)).getById(id);
    }

    @Test
    void testGetAllScoutReports() {
        // Given
        ScoutReportResponse response1 = new ScoutReportResponse(
                1L,
                "scout-keycloak-id-1",
                100L,
                8,
                7,
                9,
                7,
                "Excellent pace and finishing",
                "Needs to improve heading",
                "Highly recommended",
                true,
                LocalDateTime.of(2025, 1, 15, 10, 0)
        );

        ScoutReportResponse response2 = new ScoutReportResponse(
                2L,
                "scout-keycloak-id-2",
                101L,
                7,
                8,
                7,
                9,
                "Excellent vision and passing",
                "Needs to improve physicality",
                "Recommended",
                true,
                LocalDateTime.of(2025, 1, 20, 10, 0)
        );

        List<ScoutReportResponse> responses = Arrays.asList(response1, response2);
        given(scoutReportService.getAll()).willReturn(responses);

        // When
        ResponseEntity<List<ScoutReportResponse>> result = scoutReportController.getAll();

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody()).hasSize(2);
        verify(scoutReportService, times(1)).getAll();
    }

    @Test
    void testDeleteScoutReport() {
        // Given
        Long id = 1L;
        doNothing().when(scoutReportService).delete(id);

        // When
        ResponseEntity<Void> result = scoutReportController.delete(id);

        // Then
        assertThat(result.getStatusCodeValue()).isEqualTo(204);
        verify(scoutReportService, times(1)).delete(id);
    }
}
