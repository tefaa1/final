package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingDrillRequest;
import com.example.trainingmatchservice.dto.response.TrainingDrillResponse;
import com.example.trainingmatchservice.model.training.enums.DrillCategory;
import com.example.trainingmatchservice.service.TrainingDrillService;
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
class TrainingDrillControllerTest {

    @Mock
    private TrainingDrillService trainingDrillService;

    @InjectMocks
    private TrainingDrillController controller;

    private TrainingDrillRequest request;
    private TrainingDrillResponse response;

    @BeforeEach
    void setUp() {
        request = new TrainingDrillRequest(
                1L,
                "Drill",
                "Description",
                DrillCategory.TACTICAL,
                10,
                1,
                "Equipment",
                "Instructions",
                5);

        response = new TrainingDrillResponse(
                1L,
                1L,
                "Drill",
                "Description",
                DrillCategory.TACTICAL,
                10,
                1,
                "Equipment",
                "Instructions",
                5);
    }

    @Test
    void createTrainingDrill_shouldReturnCreated() {
        given(trainingDrillService.createTrainingDrill(any(TrainingDrillRequest.class))).willReturn(response);

        ResponseEntity<TrainingDrillResponse> result = controller.createTrainingDrill(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingDrillService).createTrainingDrill(request);
    }

    @Test
    void updateTrainingDrill_shouldReturnOk() {
        Long id = 1L;
        given(trainingDrillService.updateTrainingDrill(eq(id), any(TrainingDrillRequest.class))).willReturn(response);

        ResponseEntity<TrainingDrillResponse> result = controller.updateTrainingDrill(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingDrillService).updateTrainingDrill(id, request);
    }

    @Test
    void getTrainingDrill_shouldReturnOk() {
        Long id = 1L;
        given(trainingDrillService.getTrainingDrillById(id)).willReturn(response);

        ResponseEntity<TrainingDrillResponse> result = controller.getTrainingDrill(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingDrillService).getTrainingDrillById(id);
    }

    @Test
    void getAllTrainingDrills_shouldReturnList() {
        given(trainingDrillService.getAllTrainingDrills()).willReturn(List.of(response));

        ResponseEntity<List<TrainingDrillResponse>> result = controller.getAllTrainingDrills();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(trainingDrillService).getAllTrainingDrills();
    }

    @Test
    void deleteTrainingDrill_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteTrainingDrill(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(trainingDrillService).deleteTrainingDrill(id);
    }
}
