package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchRequest;
import com.example.trainingmatchservice.dto.response.MatchResponse;
import com.example.trainingmatchservice.model.match.enums.MatchStatus;
import com.example.trainingmatchservice.model.match.enums.MatchType;
import com.example.trainingmatchservice.model.match.enums.SportType;
import com.example.trainingmatchservice.service.MatchService;
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
class MatchControllerTest {

    @Mock
    private MatchService matchService;

    @InjectMocks
    private MatchController controller;

    private MatchRequest request;
    private MatchResponse response;

    @BeforeEach
    void setUp() {
        request = new MatchRequest(
                1L,
                2L,
                MatchType.FRIENDLY,
                MatchStatus.SCHEDULED,
                SportType.FOOTBALL,
                "Stadium",
                "League",
                "2023-2024",
                0,
                0,
                LocalDateTime.now().plusDays(1),
                null,
                "Referee",
                100,
                "Summary",
                "Notes",
                1L,
                null, null, null);

        response = new MatchResponse(
                1L,
                1L,
                2L,
                MatchType.FRIENDLY,
                MatchStatus.SCHEDULED,
                SportType.FOOTBALL,
                "Stadium",
                "League",
                "2023-2024",
                0,
                0,
                LocalDateTime.now().plusDays(1),
                null,
                "Referee",
                100,
                "Summary",
                "Notes",
                1L,
                null, null, null);
    }

    @Test
    void createMatch_shouldReturnCreated() {
        given(matchService.createMatch(any(MatchRequest.class))).willReturn(response);

        ResponseEntity<MatchResponse> result = controller.createMatch(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchService).createMatch(request);
    }

    @Test
    void updateMatch_shouldReturnOk() {
        Long id = 1L;
        given(matchService.updateMatch(eq(id), any(MatchRequest.class))).willReturn(response);

        ResponseEntity<MatchResponse> result = controller.updateMatch(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchService).updateMatch(id, request);
    }

    @Test
    void getMatch_shouldReturnOk() {
        Long id = 1L;
        given(matchService.getMatchById(id)).willReturn(response);

        ResponseEntity<MatchResponse> result = controller.getMatch(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchService).getMatchById(id);
    }

    @Test
    void getAllMatches_shouldReturnList() {
        given(matchService.getAllMatches()).willReturn(List.of(response));

        ResponseEntity<List<MatchResponse>> result = controller.getAllMatches();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(matchService).getAllMatches();
    }

    @Test
    void deleteMatch_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteMatch(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(matchService).deleteMatch(id);
    }

    @Test
    void getMatchesBySportType_shouldReturnFilteredMatches() {
        given(matchService.getMatchesBySportType(SportType.FOOTBALL)).willReturn(List.of(response));

        ResponseEntity<List<MatchResponse>> result = controller.getMatchesBySportType(SportType.FOOTBALL);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).sportType()).isEqualTo(SportType.FOOTBALL);
        verify(matchService).getMatchesBySportType(SportType.FOOTBALL);
    }
}
