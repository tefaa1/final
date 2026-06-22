package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchFormationRequest;
import com.example.trainingmatchservice.dto.response.MatchFormationResponse;
import com.example.trainingmatchservice.service.MatchFormationService;
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
class MatchFormationControllerTest {

    @Mock
    private MatchFormationService matchFormationService;

    @InjectMocks
    private MatchFormationController controller;

    private MatchFormationRequest request;
    private MatchFormationResponse response;

    @BeforeEach
    void setUp() {
        request = new MatchFormationRequest(
                1L,
                "coach-keycloak-id-1",
                "4-4-2",
                "Attacking",
                "Details");

        response = new MatchFormationResponse(
                1L,
                1L,
                "coach-keycloak-id-1",
                "4-4-2",
                "Attacking",
                "Details");
    }

    @Test
    void createMatchFormation_shouldReturnCreated() {
        given(matchFormationService.createMatchFormation(any(MatchFormationRequest.class))).willReturn(response);

        ResponseEntity<MatchFormationResponse> result = controller.createMatchFormation(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchFormationService).createMatchFormation(request);
    }

    @Test
    void updateMatchFormation_shouldReturnOk() {
        Long id = 1L;
        given(matchFormationService.updateMatchFormation(eq(id), any(MatchFormationRequest.class)))
                .willReturn(response);

        ResponseEntity<MatchFormationResponse> result = controller.updateMatchFormation(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchFormationService).updateMatchFormation(id, request);
    }

    @Test
    void getMatchFormation_shouldReturnOk() {
        Long id = 1L;
        given(matchFormationService.getMatchFormationById(id)).willReturn(response);

        ResponseEntity<MatchFormationResponse> result = controller.getMatchFormation(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchFormationService).getMatchFormationById(id);
    }

    @Test
    void getAllMatchFormations_shouldReturnList() {
        given(matchFormationService.getAllMatchFormations()).willReturn(List.of(response));

        ResponseEntity<List<MatchFormationResponse>> result = controller.getAllMatchFormations();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(matchFormationService).getAllMatchFormations();
    }

    @Test
    void deleteMatchFormation_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteMatchFormation(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(matchFormationService).deleteMatchFormation(id);
    }
}
