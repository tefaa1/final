package com.example.playerservice.controller;

import com.example.playerservice.dto.request.OuterPlayerRequest;
import com.example.playerservice.dto.response.OuterPlayerResponse;
import com.example.playerservice.model.enums.Position;
import com.example.playerservice.service.OuterPlayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OuterPlayerControllerTest {

    @Mock
    private OuterPlayerService outerPlayerService;

    @InjectMocks
    private OuterPlayerController controller;

    private OuterPlayerRequest request;
    private OuterPlayerResponse response;

    @BeforeEach
    void setUp() {
        request = new OuterPlayerRequest(
                LocalDate.of(2000, 1, 1),
                "Country",
                Position.STRIKER,
                10_000L,
                10,
                1L
        );

        response = OuterPlayerResponse.builder()
                .id(1L)
                .dateOfBirth(request.dateOfBirth())
                .nationality(request.nationality())
                .preferredPosition(request.preferredPosition())
                .marketValue(request.marketValue())
                .kitNumber(request.kitNumber())
                .outerTeamId(request.outerTeamId())
                .build();
    }

    @Test
    void createOuterPlayer_shouldReturnCreated() {
        given(outerPlayerService.createOuterPlayer(any(OuterPlayerRequest.class)))
                .willReturn(response);

        ResponseEntity<OuterPlayerResponse> result = controller.createOuterPlayer(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(outerPlayerService).createOuterPlayer(eq(request));
    }

    @Test
    void updateOuterPlayer_shouldReturnOk() {
        Long id = 1L;
        given(outerPlayerService.updateOuterPlayer(eq(id), any(OuterPlayerRequest.class)))
                .willReturn(response);

        ResponseEntity<OuterPlayerResponse> result = controller.updateOuterPlayer(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(outerPlayerService).updateOuterPlayer(id, request);
    }

    @Test
    void getOuterPlayer_shouldReturnOk() {
        Long id = 1L;
        given(outerPlayerService.getOuterPlayerById(id)).willReturn(response);

        ResponseEntity<OuterPlayerResponse> result = controller.getOuterPlayer(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(outerPlayerService).getOuterPlayerById(id);
    }

    @Test
    void getAllOuterPlayers_shouldReturnList() {
        given(outerPlayerService.getAllOuterPlayers()).willReturn(List.of(response));

        ResponseEntity<List<OuterPlayerResponse>> result = controller.getAllOuterPlayers();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(outerPlayerService).getAllOuterPlayers();
    }

    @Test
    void deleteOuterPlayer_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteOuterPlayer(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(outerPlayerService).deleteOuterPlayer(id);
    }
}

