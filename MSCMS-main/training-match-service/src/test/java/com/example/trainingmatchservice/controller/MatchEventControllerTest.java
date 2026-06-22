package com.example.trainingmatchservice.controller;

import com.example.trainingmatchservice.dto.request.MatchEventRequest;
import com.example.trainingmatchservice.dto.response.MatchEventResponse;
import com.example.trainingmatchservice.model.match.enums.EventType;
import com.example.trainingmatchservice.service.MatchEventService;
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
class MatchEventControllerTest {

    @Mock
    private MatchEventService matchEventService;

    @InjectMocks
    private MatchEventController controller;

    private MatchEventRequest request;
    private MatchEventResponse response;

    @BeforeEach
    void setUp() {
        request = new MatchEventRequest(
                1L,
                "player-keycloak-id-1",
                1L,
                EventType.GOAL,
                10,
                0,
                "Goal!");

        response = new MatchEventResponse(
                1L,
                1L,
                "player-keycloak-id-1",
                1L,
                EventType.GOAL,
                10,
                0,
                "Goal!");
    }

    @Test
    void createMatchEvent_shouldReturnCreated() {
        given(matchEventService.createMatchEvent(any(MatchEventRequest.class))).willReturn(response);

        ResponseEntity<MatchEventResponse> result = controller.createMatchEvent(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchEventService).createMatchEvent(request);
    }

    @Test
    void updateMatchEvent_shouldReturnOk() {
        Long id = 1L;
        given(matchEventService.updateMatchEvent(eq(id), any(MatchEventRequest.class))).willReturn(response);

        ResponseEntity<MatchEventResponse> result = controller.updateMatchEvent(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchEventService).updateMatchEvent(id, request);
    }

    @Test
    void getMatchEvent_shouldReturnOk() {
        Long id = 1L;
        given(matchEventService.getMatchEventById(id)).willReturn(response);

        ResponseEntity<MatchEventResponse> result = controller.getMatchEvent(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(matchEventService).getMatchEventById(id);
    }

    @Test
    void getAllMatchEvents_shouldReturnList() {
        given(matchEventService.getAllMatchEvents()).willReturn(List.of(response));

        ResponseEntity<List<MatchEventResponse>> result = controller.getAllMatchEvents();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(matchEventService).getAllMatchEvents();
    }

    @Test
    void deleteMatchEvent_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteMatchEvent(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(matchEventService).deleteMatchEvent(id);
    }
}
