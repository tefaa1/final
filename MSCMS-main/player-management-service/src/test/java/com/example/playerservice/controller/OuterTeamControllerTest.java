package com.example.playerservice.controller;

import com.example.playerservice.dto.request.OuterTeamRequest;
import com.example.playerservice.dto.response.OuterTeamResponse;
import com.example.playerservice.service.OuterTeamService;
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
class OuterTeamControllerTest {

    @Mock
    private OuterTeamService outerTeamService;

    @InjectMocks
    private OuterTeamController controller;

    private OuterTeamRequest request;
    private OuterTeamResponse response;

    @BeforeEach
    void setUp() {
        request = new OuterTeamRequest("Outer Team", "team@example.com", "Country");
        response = OuterTeamResponse.builder()
                .id(1L)
                .name("Outer Team")
                .email("team@example.com")
                .country("Country")
                .build();
    }

    @Test
    void createOuterTeam_shouldReturnCreated() {
        given(outerTeamService.createOuterTeam(any(OuterTeamRequest.class))).willReturn(response);

        ResponseEntity<OuterTeamResponse> result = controller.createOuterTeam(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(outerTeamService).createOuterTeam(eq(request));
    }

    @Test
    void updateOuterTeam_shouldReturnOk() {
        Long id = 1L;
        given(outerTeamService.updateOuterTeam(eq(id), any(OuterTeamRequest.class))).willReturn(response);

        ResponseEntity<OuterTeamResponse> result = controller.updateOuterTeam(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(outerTeamService).updateOuterTeam(id, request);
    }

    @Test
    void getOuterTeam_shouldReturnOk() {
        Long id = 1L;
        given(outerTeamService.getOuterTeamById(id)).willReturn(response);

        ResponseEntity<OuterTeamResponse> result = controller.getOuterTeam(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(outerTeamService).getOuterTeamById(id);
    }

    @Test
    void getAllOuterTeams_shouldReturnList() {
        given(outerTeamService.getAllOuterTeams()).willReturn(List.of(response));

        ResponseEntity<List<OuterTeamResponse>> result = controller.getAllOuterTeams();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(outerTeamService).getAllOuterTeams();
    }

    @Test
    void deleteOuterTeam_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteOuterTeam(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(outerTeamService).deleteOuterTeam(id);
    }
}

