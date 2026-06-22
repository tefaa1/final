package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.FitnessTestRequest;
import com.example.medicalfitnessservice.dto.response.FitnessTestResponse;
import com.example.medicalfitnessservice.model.enums.FitnessTestType;
import com.example.medicalfitnessservice.model.enums.SportType;
import com.example.medicalfitnessservice.service.FitnessTestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FitnessTestControllerTest {

    @Mock
    private FitnessTestService fitnessTestService;

    @InjectMocks
    private FitnessTestController controller;

    private FitnessTestRequest request;
    private FitnessTestResponse response;

    @BeforeEach
    void setUp() {
        request = new FitnessTestRequest(
                "player-keycloak-id-1",
                2L,
                FitnessTestType.SPEED_TEST,
                SportType.FOOTBALL,
                LocalDateTime.now(),
                "doctor-keycloak-id-1",
                "Sprint 30m",
                4.5,
                "s",
                "Excellent",
                "Notes",
                "Recommendations",
                "attachments"
        );

        response = new FitnessTestResponse(
                1L,
                request.playerKeycloakId(),
                request.teamId(),
                request.testType(),
                request.sportType(),
                request.testDate(),
                request.conductedByDoctorKeycloakId(),
                request.testName(),
                request.result(),
                request.unit(),
                request.resultCategory(),
                request.notes(),
                request.recommendations(),
                request.attachments()
        );
    }

    @Test
    void createFitnessTest_shouldReturnCreated() {
        given(fitnessTestService.createFitnessTest(any(FitnessTestRequest.class))).willReturn(response);

        ResponseEntity<FitnessTestResponse> result = controller.createFitnessTest(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        assertThat(result.getBody().sportType()).isEqualTo(SportType.FOOTBALL);
        verify(fitnessTestService).createFitnessTest(eq(request));
    }

    @Test
    void updateFitnessTest_shouldReturnOk() {
        Long id = 1L;
        given(fitnessTestService.updateFitnessTest(eq(id), any(FitnessTestRequest.class))).willReturn(response);

        ResponseEntity<FitnessTestResponse> result = controller.updateFitnessTest(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(fitnessTestService).updateFitnessTest(id, request);
    }

    @Test
    void getFitnessTest_shouldReturnOk() {
        Long id = 1L;
        given(fitnessTestService.getFitnessTestById(id)).willReturn(response);

        ResponseEntity<FitnessTestResponse> result = controller.getFitnessTest(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(fitnessTestService).getFitnessTestById(id);
    }

    @Test
    void getAllFitnessTests_shouldReturnList() {
        given(fitnessTestService.getAllFitnessTests()).willReturn(List.of(response));

        ResponseEntity<List<FitnessTestResponse>> result = controller.getAllFitnessTests();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(fitnessTestService).getAllFitnessTests();
    }

    @Test
    void getFitnessTestsBySportType_shouldReturnFilteredTests() {
        given(fitnessTestService.getFitnessTestsBySportType(SportType.FOOTBALL)).willReturn(List.of(response));

        ResponseEntity<List<FitnessTestResponse>> result = controller.getFitnessTestsBySportType(SportType.FOOTBALL);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).sportType()).isEqualTo(SportType.FOOTBALL);
        verify(fitnessTestService).getFitnessTestsBySportType(SportType.FOOTBALL);
    }

    @Test
    void deleteFitnessTest_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteFitnessTest(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(fitnessTestService).deleteFitnessTest(id);
    }
}
