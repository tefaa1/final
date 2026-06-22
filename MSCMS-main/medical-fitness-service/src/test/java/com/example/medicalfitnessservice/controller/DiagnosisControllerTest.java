package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.DiagnosisRequest;
import com.example.medicalfitnessservice.dto.response.DiagnosisResponse;
import com.example.medicalfitnessservice.service.DiagnosisService;
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
class DiagnosisControllerTest {

    @Mock
    private DiagnosisService diagnosisService;

    @InjectMocks
    private DiagnosisController controller;

    private DiagnosisRequest request;
    private DiagnosisResponse response;

    @BeforeEach
    void setUp() {
        request = new DiagnosisRequest(
                1L,
                "player-keycloak-id-1",
                "doctor-keycloak-id-1",
                "Diagnosis",
                "Notes",
                "Recommendations",
                LocalDateTime.now(),
                "Test results",
                "attachments"
        );

        response = new DiagnosisResponse(
                1L,
                request.injuryId(),
                request.playerKeycloakId(),
                request.doctorKeycloakId(),
                request.diagnosis(),
                request.medicalNotes(),
                request.recommendations(),
                request.diagnosedAt(),
                request.testResults(),
                request.attachments()
        );
    }

    @Test
    void createDiagnosis_shouldReturnCreated() {
        given(diagnosisService.createDiagnosis(any(DiagnosisRequest.class))).willReturn(response);

        ResponseEntity<DiagnosisResponse> result = controller.createDiagnosis(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(diagnosisService).createDiagnosis(eq(request));
    }

    @Test
    void updateDiagnosis_shouldReturnOk() {
        Long id = 1L;
        given(diagnosisService.updateDiagnosis(eq(id), any(DiagnosisRequest.class))).willReturn(response);

        ResponseEntity<DiagnosisResponse> result = controller.updateDiagnosis(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(diagnosisService).updateDiagnosis(id, request);
    }

    @Test
    void getDiagnosis_shouldReturnOk() {
        Long id = 1L;
        given(diagnosisService.getDiagnosisById(id)).willReturn(response);

        ResponseEntity<DiagnosisResponse> result = controller.getDiagnosis(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(diagnosisService).getDiagnosisById(id);
    }

    @Test
    void getAllDiagnoses_shouldReturnList() {
        given(diagnosisService.getAllDiagnoses()).willReturn(List.of(response));

        ResponseEntity<List<DiagnosisResponse>> result = controller.getAllDiagnoses();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(diagnosisService).getAllDiagnoses();
    }

    @Test
    void deleteDiagnosis_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteDiagnosis(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(diagnosisService).deleteDiagnosis(id);
    }
}

