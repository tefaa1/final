package com.example.medicalfitnessservice.controller;

import com.example.medicalfitnessservice.dto.request.InjuryRequest;
import com.example.medicalfitnessservice.dto.response.InjuryResponse;
import com.example.medicalfitnessservice.model.enums.InjurySeverity;
import com.example.medicalfitnessservice.model.enums.InjuryStatus;
import com.example.medicalfitnessservice.model.enums.InjuryType;
import com.example.medicalfitnessservice.service.InjuryService;
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
class InjuryControllerTest {

    @Mock
    private InjuryService injuryService;

    @InjectMocks
    private InjuryController controller;

    private InjuryRequest request;
    private InjuryResponse response;

    @BeforeEach
    void setUp() {
        request = new InjuryRequest(
                1L,
                2L,
                InjuryType.MUSCLE_STRAIN,
                InjurySeverity.MINOR,
                InjuryStatus.REPORTED,
                "Left Knee",
                "Minor strain",
                LocalDate.now(),
                LocalDateTime.now(),
                10L
        );

        response = new InjuryResponse(
                1L,
                1L,
                2L,
                request.injuryType(),
                request.severity(),
                request.status(),
                request.bodyPart(),
                request.description(),
                request.injuryDate(),
                request.reportedAt(),
                request.reportedByDoctorId()
        );
    }

    @Test
    void createInjury_shouldReturnCreated() {
        given(injuryService.createInjury(any(InjuryRequest.class))).willReturn(response);

        ResponseEntity<InjuryResponse> result = controller.createInjury(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
        verify(injuryService).createInjury(eq(request));
    }

    @Test
    void updateInjury_shouldReturnOk() {
        Long id = 1L;
        given(injuryService.updateInjury(eq(id), any(InjuryRequest.class))).willReturn(response);

        ResponseEntity<InjuryResponse> result = controller.updateInjury(id, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(injuryService).updateInjury(id, request);
    }

    @Test
    void getInjury_shouldReturnOk() {
        Long id = 1L;
        given(injuryService.getInjuryById(id)).willReturn(response);

        ResponseEntity<InjuryResponse> result = controller.getInjury(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
        verify(injuryService).getInjuryById(id);
    }

    @Test
    void getAllInjuries_shouldReturnList() {
        given(injuryService.getAllInjuries()).willReturn(List.of(response));

        ResponseEntity<List<InjuryResponse>> result = controller.getAllInjuries();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
        verify(injuryService).getAllInjuries();
    }

    @Test
    void deleteInjury_shouldReturnNoContent() {
        Long id = 1L;

        ResponseEntity<Void> result = controller.deleteInjury(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(injuryService).deleteInjury(id);
    }
}

