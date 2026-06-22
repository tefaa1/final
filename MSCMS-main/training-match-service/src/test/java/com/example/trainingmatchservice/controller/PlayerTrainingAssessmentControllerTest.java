package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.PlayerTrainingAssessmentRequest;
import com.example.trainingmatchservice.dto.response.PlayerTrainingAssessmentResponse;
import com.example.trainingmatchservice.model.training.enums.PlayerCondition;
import com.example.trainingmatchservice.service.PlayerTrainingAssessmentService;
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
class PlayerTrainingAssessmentControllerTest {

    @Mock
    private PlayerTrainingAssessmentService playerTrainingAssessmentService;

    @InjectMocks
    private PlayerTrainingAssessmentController controller;

    private PlayerTrainingAssessmentRequest request;
    private PlayerTrainingAssessmentResponse response;

    @BeforeEach
    void setUp() {
        request = new PlayerTrainingAssessmentRequest(
                1L,
                1L,
                1L,
                8,
                9,
                10,
                PlayerCondition.GOOD,
                "Strong",
                "None",
                "Good job");

        response = new PlayerTrainingAssessmentResponse(
                1L,
                1L,
                1L,
                1L,
                8,
                9,
                10,
                PlayerCondition.GOOD,
                "Strong",
                "None",
                "Good job");
    }

    @Test
    void createPlayerTrainingAssessment_shouldReturnCreated() {
        given(playerTrainingAssessmentService
                .createPlayerTrainingAssessment(any(PlayerTrainingAssessmentRequest.class))).willReturn(response);

        ResponseEntity<PlayerTrainingAssessmentResponse> result = controller.createPlayerTrainingAssessment(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTrainingAssessmentService).createPlayerTrainingAssessment(request);
    }

    @Test
    void updatePlayerTrainingAssessment_shouldReturnOk() {
        Long id = 1L;
        given(playerTrainingAssessmentService.updatePlayerTrainingAssessment(eq(id),
                any(PlayerTrainingAssessmentRequest.class))).willReturn(response);

        ResponseEntity<PlayerTrainingAssessmentResponse> result = controller.updatePlayerTrainingAssessment(id,
                request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTrainingAssessmentService).updatePlayerTrainingAssessment(id, request);
    }

    @Test
    void getPlayerTrainingAssessment_shouldReturnOk() {
        Long id = 1L;
        given(playerTrainingAssessmentService.getPlayerTrainingAssessmentById(id)).willReturn(response);

        ResponseEntity<PlayerTrainingAssessmentResponse> result = controller.getPlayerTrainingAssessment(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(playerTrainingAssessmentService).getPlayerTrainingAssessmentById(id);
    }

    @Test
    void getAllPlayerTrainingAssessments_shouldReturnList() {
        given(playerTrainingAssessmentService.getAllPlayerTrainingAssessments()).willReturn(List.of(response));

        ResponseEntity<List<PlayerTrainingAssessmentResponse>> result = controller.getAllPlayerTrainingAssessments();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(playerTrainingAssessmentService).getAllPlayerTrainingAssessments();
    }

    @Test
    void deletePlayerTrainingAssessment_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deletePlayerTrainingAssessment(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(playerTrainingAssessmentService).deletePlayerTrainingAssessment(id);
    }
}
