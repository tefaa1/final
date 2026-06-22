package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingPlanRequest;
import com.example.trainingmatchservice.dto.response.TrainingPlanResponse;
import com.example.trainingmatchservice.model.training.enums.PlanStatus;
import com.example.trainingmatchservice.service.TrainingPlanService;
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
class TrainingPlanControllerTest {

    @Mock
    private TrainingPlanService trainingPlanService;

    @InjectMocks
    private TrainingPlanController controller;

    private TrainingPlanRequest request;
    private TrainingPlanResponse response;

    @BeforeEach
    void setUp() {
        request = new TrainingPlanRequest(
                "Title",
                "Description",
                1L,
                1L,
                LocalDate.now(),
                LocalDate.now().plusDays(7),
                PlanStatus.DRAFT,
                "Goals",
                "Focus");

        response = new TrainingPlanResponse(
                1L,
                "Title",
                "Description",
                1L,
                1L,
                LocalDate.now(),
                LocalDate.now().plusDays(7),
                PlanStatus.DRAFT,
                "Goals",
                "Focus");
    }

    @Test
    void createTrainingPlan_shouldReturnCreated() {
        given(trainingPlanService.createTrainingPlan(any(TrainingPlanRequest.class))).willReturn(response);

        ResponseEntity<TrainingPlanResponse> result = controller.createTrainingPlan(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingPlanService).createTrainingPlan(request);
    }

    @Test
    void updateTrainingPlan_shouldReturnOk() {
        Long id = 1L;
        given(trainingPlanService.updateTrainingPlan(eq(id), any(TrainingPlanRequest.class))).willReturn(response);

        ResponseEntity<TrainingPlanResponse> result = controller.updateTrainingPlan(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingPlanService).updateTrainingPlan(id, request);
    }

    @Test
    void getTrainingPlan_shouldReturnOk() {
        Long id = 1L;
        given(trainingPlanService.getTrainingPlanById(id)).willReturn(response);

        ResponseEntity<TrainingPlanResponse> result = controller.getTrainingPlan(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingPlanService).getTrainingPlanById(id);
    }

    @Test
    void getAllTrainingPlans_shouldReturnList() {
        given(trainingPlanService.getAllTrainingPlans()).willReturn(List.of(response));

        ResponseEntity<List<TrainingPlanResponse>> result = controller.getAllTrainingPlans();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(trainingPlanService).getAllTrainingPlans();
    }

    @Test
    void deleteTrainingPlan_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteTrainingPlan(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(trainingPlanService).deleteTrainingPlan(id);
    }
}
