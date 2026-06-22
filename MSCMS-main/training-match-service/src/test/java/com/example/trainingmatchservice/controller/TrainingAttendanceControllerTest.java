package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.TrainingAttendanceRequest;
import com.example.trainingmatchservice.dto.response.TrainingAttendanceResponse;
import com.example.trainingmatchservice.model.training.enums.AttendanceStatus;
import com.example.trainingmatchservice.service.TrainingAttendanceService;
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
class TrainingAttendanceControllerTest {

    @Mock
    private TrainingAttendanceService trainingAttendanceService;

    @InjectMocks
    private TrainingAttendanceController controller;

    private TrainingAttendanceRequest request;
    private TrainingAttendanceResponse response;

    @BeforeEach
    void setUp() {
        request = new TrainingAttendanceRequest(
                1L,
                1L,
                AttendanceStatus.PRESENT,
                LocalDateTime.now(),
                "Reason",
                "Notes");

        response = new TrainingAttendanceResponse(
                1L,
                1L,
                1L,
                AttendanceStatus.PRESENT,
                LocalDateTime.now(),
                "Reason",
                "Notes");
    }

    @Test
    void createTrainingAttendance_shouldReturnCreated() {
        given(trainingAttendanceService.createTrainingAttendance(any(TrainingAttendanceRequest.class)))
                .willReturn(response);

        ResponseEntity<TrainingAttendanceResponse> result = controller.createTrainingAttendance(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingAttendanceService).createTrainingAttendance(request);
    }

    @Test
    void updateTrainingAttendance_shouldReturnOk() {
        Long id = 1L;
        given(trainingAttendanceService.updateTrainingAttendance(eq(id), any(TrainingAttendanceRequest.class)))
                .willReturn(response);

        ResponseEntity<TrainingAttendanceResponse> result = controller.updateTrainingAttendance(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingAttendanceService).updateTrainingAttendance(id, request);
    }

    @Test
    void getTrainingAttendance_shouldReturnOk() {
        Long id = 1L;
        given(trainingAttendanceService.getTrainingAttendanceById(id)).willReturn(response);

        ResponseEntity<TrainingAttendanceResponse> result = controller.getTrainingAttendance(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(trainingAttendanceService).getTrainingAttendanceById(id);
    }

    @Test
    void getAllTrainingAttendances_shouldReturnList() {
        given(trainingAttendanceService.getAllTrainingAttendances()).willReturn(List.of(response));

        ResponseEntity<List<TrainingAttendanceResponse>> result = controller.getAllTrainingAttendances();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(trainingAttendanceService).getAllTrainingAttendances();
    }

    @Test
    void deleteTrainingAttendance_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteTrainingAttendance(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(trainingAttendanceService).deleteTrainingAttendance(id);
    }
}
