package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.TreatmentRequest;
import com.example.medicalfitnessservice.dto.response.TreatmentResponse;
import com.example.medicalfitnessservice.model.enums.TreatmentStatus;
import com.example.medicalfitnessservice.service.TreatmentService;
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
class TreatmentControllerTest {

    @Mock
    private TreatmentService treatmentService;

    @InjectMocks
    private TreatmentController controller;

    private TreatmentRequest request;
    private TreatmentResponse response;

    @BeforeEach
    void setUp() {
        request = new TreatmentRequest(
                1L,
                1L,
                10L,
                "Medication",
                "Description",
                "Med",
                "1 pill",
                TreatmentStatus.PLANNED,
                LocalDate.now(),
                LocalDate.now().plusDays(7),
                LocalDateTime.now(),
                "Notes",
                "Response"
        );

        response = new TreatmentResponse(
                1L,
                request.injuryId(),
                request.playerId(),
                request.doctorId(),
                request.treatmentType(),
                request.description(),
                request.medication(),
                request.dosage(),
                request.status(),
                request.startDate(),
                request.endDate(),
                request.createdAt(),
                request.notes(),
                request.response()
        );
    }

    @Test
    void createTreatment_shouldReturnCreated() {
        given(treatmentService.createTreatment(any(TreatmentRequest.class))).willReturn(response);

        ResponseEntity<TreatmentResponse> result = controller.createTreatment(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(treatmentService).createTreatment(eq(request));
    }

    @Test
    void updateTreatment_shouldReturnOk() {
        Long id = 1L;
        given(treatmentService.updateTreatment(eq(id), any(TreatmentRequest.class))).willReturn(response);

        ResponseEntity<TreatmentResponse> result = controller.updateTreatment(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(treatmentService).updateTreatment(id, request);
    }

    @Test
    void getTreatment_shouldReturnOk() {
        Long id = 1L;
        given(treatmentService.getTreatmentById(id)).willReturn(response);

        ResponseEntity<TreatmentResponse> result = controller.getTreatment(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(treatmentService).getTreatmentById(id);
    }

    @Test
    void getAllTreatments_shouldReturnList() {
        given(treatmentService.getAllTreatments()).willReturn(List.of(response));

        ResponseEntity<List<TreatmentResponse>> result = controller.getAllTreatments();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(treatmentService).getAllTreatments();
    }

    @Test
    void deleteTreatment_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteTreatment(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(treatmentService).deleteTreatment(id);
    }
}

