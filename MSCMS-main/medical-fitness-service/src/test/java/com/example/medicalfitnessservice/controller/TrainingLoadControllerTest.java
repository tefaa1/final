package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.TrainingLoadRequest;
import com.example.medicalfitnessservice.dto.response.TrainingLoadResponse;
import com.example.medicalfitnessservice.service.TrainingLoadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TrainingLoadControllerTest {

    @Mock
    private TrainingLoadService trainingLoadService;

    @InjectMocks
    private TrainingLoadController controller;

    private TrainingLoadRequest request;
    private TrainingLoadResponse response;

    @BeforeEach
    void setUp() {
        request = new TrainingLoadRequest(
                1L,
                2L,
                3L,
                LocalDate.now(),
                90,
                0.8,
                72.0,
                10,
                120,
                180,
                "Cardio",
                "Notes"
        );

        response = new TrainingLoadResponse(
                1L,
                request.playerId(),
                request.teamId(),
                request.trainingSessionId(),
                request.date(),
                request.durationMinutes(),
                request.intensity(),
                request.load(),
                request.distanceKm(),
                request.heartRateAvg(),
                request.heartRateMax(),
                request.trainingType(),
                request.notes()
        );
    }

    @Test
    void createTrainingLoad_shouldReturnCreated() {
        given(trainingLoadService.createTrainingLoad(any(TrainingLoadRequest.class))).willReturn(response);

        ResponseEntity<TrainingLoadResponse> result = controller.createTrainingLoad(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingLoadService).createTrainingLoad(eq(request));
    }

    @Test
    void updateTrainingLoad_shouldReturnOk() {
        Long id = 1L;
        given(trainingLoadService.updateTrainingLoad(eq(id), any(TrainingLoadRequest.class))).willReturn(response);

        ResponseEntity<TrainingLoadResponse> result = controller.updateTrainingLoad(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingLoadService).updateTrainingLoad(id, request);
    }

    @Test
    void getTrainingLoad_shouldReturnOk() {
        Long id = 1L;
        given(trainingLoadService.getTrainingLoadById(id)).willReturn(response);

        ResponseEntity<TrainingLoadResponse> result = controller.getTrainingLoad(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingLoadService).getTrainingLoadById(id);
    }

    @Test
    void getAllTrainingLoads_shouldReturnList() {
        given(trainingLoadService.getAllTrainingLoads()).willReturn(List.of(response));

        ResponseEntity<List<TrainingLoadResponse>> result = controller.getAllTrainingLoads();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(trainingLoadService).getAllTrainingLoads();
    }

    @Test
    void deleteTrainingLoad_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteTrainingLoad(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(trainingLoadService).deleteTrainingLoad(id);
    }
}

