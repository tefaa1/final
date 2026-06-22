package com.example.playerservice.controller;

import com.example.playerservice.dto.request.SportRequest;
import com.example.playerservice.dto.response.SportResponse;
import com.example.playerservice.model.enums.SportType;
import com.example.playerservice.service.SportService;
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
class SportControllerTest {

    @Mock
    private SportService sportService;

    @InjectMocks
    private SportController sportController;

    private SportRequest footballRequest;
    private SportResponse footballResponse;
    private SportResponse basketballResponse;

    @BeforeEach
    void setUp() {
        footballRequest = new SportRequest("Football", 1L, SportType.FOOTBALL);
        footballResponse = new SportResponse(1L, "Football", 1L, SportType.FOOTBALL);
        basketballResponse = new SportResponse(2L, "Basketball", 2L, SportType.BASKETBALL);
    }

    @Test
    void createSport_shouldReturnCreatedResponse() {
        given(sportService.createSport(any(SportRequest.class))).willReturn(footballResponse);

        ResponseEntity<SportResponse> result = sportController.createSport(footballRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(footballResponse);
        assertThat(result.getBody().getSportType()).isEqualTo(SportType.FOOTBALL);
        verify(sportService).createSport(eq(footballRequest));
    }

    @Test
    void updateSport_shouldReturnOkResponse() {
        Long id = 1L;
        given(sportService.updateSport(eq(id), any(SportRequest.class))).willReturn(footballResponse);

        ResponseEntity<SportResponse> result = sportController.updateSport(id, footballRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(footballResponse);
        verify(sportService).updateSport(id, footballRequest);
    }

    @Test
    void getSport_shouldReturnOkResponse() {
        Long id = 1L;
        given(sportService.getSportById(id)).willReturn(footballResponse);

        ResponseEntity<SportResponse> result = sportController.getSport(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(footballResponse);
        verify(sportService).getSportById(id);
    }

    @Test
    void getAllSports_shouldReturnAllSports() {
        given(sportService.getAllSports()).willReturn(List.of(footballResponse, basketballResponse));

        ResponseEntity<List<SportResponse>> result = sportController.getAllSports();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(2);
        verify(sportService).getAllSports();
    }

    @Test
    void getSportsByType_shouldReturnFilteredSports() {
        given(sportService.getSportsByType(SportType.BASKETBALL)).willReturn(List.of(basketballResponse));

        ResponseEntity<List<SportResponse>> result = sportController.getSportsByType(SportType.BASKETBALL);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).hasSize(1);
        assertThat(result.getBody().get(0).getSportType()).isEqualTo(SportType.BASKETBALL);
        verify(sportService).getSportsByType(SportType.BASKETBALL);
    }

    @Test
    void deleteSport_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = sportController.deleteSport(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(sportService).deleteSport(id);
    }
}
