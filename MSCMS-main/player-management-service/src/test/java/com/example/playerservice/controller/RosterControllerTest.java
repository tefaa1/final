package com.example.playerservice.controller;

import com.example.playerservice.dto.request.RosterRequest;
import com.example.playerservice.dto.response.RosterResponse;
import com.example.playerservice.service.RosterService;
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
class RosterControllerTest {

    @Mock
    private RosterService rosterService;

    @InjectMocks
    private RosterController rosterController;

    private RosterRequest request;
    private RosterResponse response;

    @BeforeEach
    void setUp() {
        request = new RosterRequest(1L, "2024/2025", 1L);
        response = new RosterResponse(1L, 1L, "2024/2025", 1L);
    }

    @Test
    void createRoster_shouldReturnCreatedResponse() {
        given(rosterService.createRoster(any(RosterRequest.class))).willReturn(response);

        ResponseEntity<RosterResponse> result = rosterController.createRoster(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(rosterService).createRoster(eq(request));
    }

    @Test
    void updateRoster_shouldReturnOkResponse() {
        Long id = 1L;
        given(rosterService.updateRoster(eq(id), any(RosterRequest.class))).willReturn(response);

        ResponseEntity<RosterResponse> result = rosterController.updateRoster(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(rosterService).updateRoster(id, request);
    }

    @Test
    void getRoster_shouldReturnOkResponse() {
        Long id = 1L;
        given(rosterService.getRosterById(id)).willReturn(response);

        ResponseEntity<RosterResponse> result = rosterController.getRoster(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(rosterService).getRosterById(id);
    }

    @Test
    void getAllRosters_shouldReturnList() {
        given(rosterService.getAllRosters()).willReturn(List.of(response));

        ResponseEntity<List<RosterResponse>> result = rosterController.getAllRosters();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(rosterService).getAllRosters();
    }

    @Test
    void deleteRoster_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = rosterController.deleteRoster(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(rosterService).deleteRoster(id);
    }
}

