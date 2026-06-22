package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingSessionRequest;
import com.example.trainingmatchservice.dto.response.TrainingSessionResponse;
import com.example.trainingmatchservice.model.training.enums.TrainingStatus;
import com.example.trainingmatchservice.model.training.enums.TrainingType;
import com.example.trainingmatchservice.service.TrainingSessionService;
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
class TrainingSessionControllerTest {

    @Mock
    private TrainingSessionService trainingSessionService;

    @InjectMocks
    private TrainingSessionController controller;

    private TrainingSessionRequest request;
    private TrainingSessionResponse response;

    @BeforeEach
    void setUp() {
        request = new TrainingSessionRequest(
                1L,
                TrainingType.TACTICAL,
                TrainingStatus.SCHEDULED,
                LocalDateTime.now().plusDays(1),
                90,
                "Field A",
                1L,
                null,
                "Tactics",
                "Description",
                "Notes");

        response = new TrainingSessionResponse(
                1L,
                1L,
                TrainingType.TACTICAL,
                TrainingStatus.SCHEDULED,
                LocalDateTime.now().plusDays(1),
                90,
                "Field A",
                1L,
                null,
                "Tactics",
                "Description",
                "Notes");
    }

    @Test
    void createTrainingSession_shouldReturnCreated() {
        given(trainingSessionService.createTrainingSession(any(TrainingSessionRequest.class))).willReturn(response);

        ResponseEntity<TrainingSessionResponse> result = controller.createTrainingSession(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingSessionService).createTrainingSession(request);
    }

    @Test
    void updateTrainingSession_shouldReturnOk() {
        Long id = 1L;
        given(trainingSessionService.updateTrainingSession(eq(id), any(TrainingSessionRequest.class)))
                .willReturn(response);

        ResponseEntity<TrainingSessionResponse> result = controller.updateTrainingSession(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingSessionService).updateTrainingSession(id, request);
    }

    @Test
    void getTrainingSession_shouldReturnOk() {
        Long id = 1L;
        given(trainingSessionService.getTrainingSessionById(id)).willReturn(response);

        ResponseEntity<TrainingSessionResponse> result = controller.getTrainingSession(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingSessionService).getTrainingSessionById(id);
    }

    @Test
    void getAllTrainingSessions_shouldReturnList() {
        given(trainingSessionService.getAllTrainingSessions()).willReturn(List.of(response));

        ResponseEntity<List<TrainingSessionResponse>> result = controller.getAllTrainingSessions();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(trainingSessionService).getAllTrainingSessions();
    }

    @Test
    void deleteTrainingSession_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteTrainingSession(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(trainingSessionService).deleteTrainingSession(id);
    }
}
