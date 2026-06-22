package com.example.playerservice.controller;

import com.example.playerservice.dto.request.TeamRequest;
import com.example.playerservice.dto.response.TeamResponse;
import com.example.playerservice.service.TeamService;
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
class TeamControllerTest {

    @Mock
    private TeamService teamService;

    @InjectMocks
    private TeamController teamController;

    private TeamRequest request;
    private TeamResponse response;

    @BeforeEach
    void setUp() {
        request = new TeamRequest("Team A", "Country", 1L);
        response = new TeamResponse(1L, "Team A", "Country", 1L);
    }

    @Test
    void createTeam_shouldReturnCreatedResponse() {
        given(teamService.createTeam(any(TeamRequest.class))).willReturn(response);

        ResponseEntity<TeamResponse> result = teamController.createTeam(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(teamService).createTeam(eq(request));
    }

    @Test
    void updateTeam_shouldReturnOkResponse() {
        Long id = 1L;
        given(teamService.updateTeam(eq(id), any(TeamRequest.class))).willReturn(response);

        ResponseEntity<TeamResponse> result = teamController.updateTeam(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(teamService).updateTeam(id, request);
    }

    @Test
    void getTeam_shouldReturnOkResponse() {
        Long id = 1L;
        given(teamService.getTeamById(id)).willReturn(response);

        ResponseEntity<TeamResponse> result = teamController.getTeam(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(teamService).getTeamById(id);
    }

    @Test
    void getAllTeams_shouldReturnList() {
        given(teamService.getAllTeams()).willReturn(List.of(response));

        ResponseEntity<List<TeamResponse>> result = teamController.getAllTeams();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(teamService).getAllTeams();
    }

    @Test
    void deleteTeam_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = teamController.deleteTeam(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(teamService).deleteTeam(id);
    }
}

