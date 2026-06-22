package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.RecoveryProgramRequest;
import com.example.medicalfitnessservice.dto.response.RecoveryProgramResponse;
import com.example.medicalfitnessservice.model.enums.RecoveryProgramStatus;
import com.example.medicalfitnessservice.service.RecoveryProgramService;
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
class RecoveryProgramControllerTest {

    @Mock
    private RecoveryProgramService recoveryProgramService;

    @InjectMocks
    private RecoveryProgramController controller;

    private RecoveryProgramRequest request;
    private RecoveryProgramResponse response;

    @BeforeEach
    void setUp() {
        request = new RecoveryProgramRequest(
                1L,
                1L,
                10L,
                RecoveryProgramStatus.ACTIVE,
                "Program",
                "Description",
                "Activities",
                "Nutrition",
                LocalDate.now(),
                LocalDate.now().plusWeeks(4),
                LocalDateTime.now(),
                3,
                60,
                "Progress",
                "Goals"
        );

        response = new RecoveryProgramResponse(
                1L,
                request.rehabilitationId(),
                request.playerId(),
                request.createdByDoctorId(),
                request.status(),
                request.programName(),
                request.description(),
                request.activities(),
                request.nutritionPlan(),
                request.startDate(),
                request.endDate(),
                request.createdAt(),
                request.sessionsPerWeek(),
                request.durationMinutes(),
                request.progressNotes(),
                request.goals()
        );
    }

    @Test
    void createRecoveryProgram_shouldReturnCreated() {
        given(recoveryProgramService.createRecoveryProgram(any(RecoveryProgramRequest.class))).willReturn(response);

        ResponseEntity<RecoveryProgramResponse> result = controller.createRecoveryProgram(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(recoveryProgramService).createRecoveryProgram(eq(request));
    }

    @Test
    void updateRecoveryProgram_shouldReturnOk() {
        Long id = 1L;
        given(recoveryProgramService.updateRecoveryProgram(eq(id), any(RecoveryProgramRequest.class))).willReturn(response);

        ResponseEntity<RecoveryProgramResponse> result = controller.updateRecoveryProgram(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(recoveryProgramService).updateRecoveryProgram(id, request);
    }

    @Test
    void getRecoveryProgram_shouldReturnOk() {
        Long id = 1L;
        given(recoveryProgramService.getRecoveryProgramById(id)).willReturn(response);

        ResponseEntity<RecoveryProgramResponse> result = controller.getRecoveryProgram(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(recoveryProgramService).getRecoveryProgramById(id);
    }

    @Test
    void getAllRecoveryPrograms_shouldReturnList() {
        given(recoveryProgramService.getAllRecoveryPrograms()).willReturn(List.of(response));

        ResponseEntity<List<RecoveryProgramResponse>> result = controller.getAllRecoveryPrograms();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(recoveryProgramService).getAllRecoveryPrograms();
    }

    @Test
    void deleteRecoveryProgram_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteRecoveryProgram(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(recoveryProgramService).deleteRecoveryProgram(id);
    }
}

