package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.RehabilitationRequest;
import com.example.medicalfitnessservice.dto.response.RehabilitationResponse;
import com.example.medicalfitnessservice.model.enums.RehabStatus;
import com.example.medicalfitnessservice.service.RehabilitationService;
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
class RehabilitationControllerTest {

    @Mock
    private RehabilitationService rehabilitationService;

    @InjectMocks
    private RehabilitationController controller;

    private RehabilitationRequest request;
    private RehabilitationResponse response;

    @BeforeEach
    void setUp() {
        request = new RehabilitationRequest(
                1L,
                1L,
                10L,
                RehabStatus.NOT_STARTED,
                "Plan",
                "Exercises",
                4,
                LocalDate.now(),
                LocalDate.now().plusWeeks(4),
                null,
                LocalDateTime.now(),
                "Progress",
                "Restrictions"
        );

        response = new RehabilitationResponse(
                1L,
                request.injuryId(),
                request.playerId(),
                request.physiotherapistId(),
                request.status(),
                request.rehabPlan(),
                request.exercises(),
                request.durationWeeks(),
                request.startDate(),
                request.expectedEndDate(),
                request.actualEndDate(),
                request.createdAt(),
                request.progressNotes(),
                request.restrictions()
        );
    }

    @Test
    void createRehabilitation_shouldReturnCreated() {
        given(rehabilitationService.createRehabilitation(any(RehabilitationRequest.class))).willReturn(response);

        ResponseEntity<RehabilitationResponse> result = controller.createRehabilitation(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(rehabilitationService).createRehabilitation(eq(request));
    }

    @Test
    void updateRehabilitation_shouldReturnOk() {
        Long id = 1L;
        given(rehabilitationService.updateRehabilitation(eq(id), any(RehabilitationRequest.class))).willReturn(response);

        ResponseEntity<RehabilitationResponse> result = controller.updateRehabilitation(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(rehabilitationService).updateRehabilitation(id, request);
    }

    @Test
    void getRehabilitation_shouldReturnOk() {
        Long id = 1L;
        given(rehabilitationService.getRehabilitationById(id)).willReturn(response);

        ResponseEntity<RehabilitationResponse> result = controller.getRehabilitation(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(rehabilitationService).getRehabilitationById(id);
    }

    @Test
    void getAllRehabilitations_shouldReturnList() {
        given(rehabilitationService.getAllRehabilitations()).willReturn(List.of(response));

        ResponseEntity<List<RehabilitationResponse>> result = controller.getAllRehabilitations();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(rehabilitationService).getAllRehabilitations();
    }

    @Test
    void deleteRehabilitation_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteRehabilitation(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(rehabilitationService).deleteRehabilitation(id);
    }
}

