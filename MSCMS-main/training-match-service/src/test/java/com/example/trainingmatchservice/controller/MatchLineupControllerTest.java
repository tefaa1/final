package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchLineupRequest;
import com.example.trainingmatchservice.dto.response.MatchLineupResponse;
import com.example.trainingmatchservice.model.match.enums.LineupStatus;
import com.example.trainingmatchservice.model.match.enums.Position;
import com.example.trainingmatchservice.service.MatchLineupService;
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
class MatchLineupControllerTest {

    @Mock
    private MatchLineupService matchLineupService;

    @InjectMocks
    private MatchLineupController controller;

    private MatchLineupRequest request;
    private MatchLineupResponse response;

    @BeforeEach
    void setUp() {
        request = new MatchLineupRequest(
                1L,
                1L,
                1L,
                LineupStatus.STARTING_11,
                Position.STRIKER,
                10,
                false,
                null,
                null);

        response = new MatchLineupResponse(
                1L,
                1L,
                1L,
                1L,
                LineupStatus.STARTING_11,
                Position.STRIKER,
                10,
                false,
                null,
                null);
    }

    @Test
    void createMatchLineup_shouldReturnCreated() {
        given(matchLineupService.createMatchLineup(any(MatchLineupRequest.class))).willReturn(response);

        ResponseEntity<MatchLineupResponse> result = controller.createMatchLineup(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchLineupService).createMatchLineup(request);
    }

    @Test
    void updateMatchLineup_shouldReturnOk() {
        Long id = 1L;
        given(matchLineupService.updateMatchLineup(eq(id), any(MatchLineupRequest.class))).willReturn(response);

        ResponseEntity<MatchLineupResponse> result = controller.updateMatchLineup(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchLineupService).updateMatchLineup(id, request);
    }

    @Test
    void getMatchLineup_shouldReturnOk() {
        Long id = 1L;
        given(matchLineupService.getMatchLineupById(id)).willReturn(response);

        ResponseEntity<MatchLineupResponse> result = controller.getMatchLineup(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchLineupService).getMatchLineupById(id);
    }

    @Test
    void getAllMatchLineups_shouldReturnList() {
        given(matchLineupService.getAllMatchLineups()).willReturn(List.of(response));

        ResponseEntity<List<MatchLineupResponse>> result = controller.getAllMatchLineups();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(matchLineupService).getAllMatchLineups();
    }

    @Test
    void deleteMatchLineup_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteMatchLineup(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(matchLineupService).deleteMatchLineup(id);
    }
}
