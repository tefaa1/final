package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.scoutReq.ScoutRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.scoutRes.ScoutResponse;
import com.example.usermanagementservice.dto.update.scoutUp.ScoutUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.service.scoutService.ScoutService;
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
class ScoutControllerTest {

    @Mock
    private ScoutService scoutService;

    @InjectMocks
    private ScoutController controller;

    private ScoutRequest request;
    private ScoutUpdateRequest updateRequest;
    private ScoutResponse response;

    @BeforeEach
    void setUp() {
        request = new ScoutRequest();
        request.setUsername("scout1");
        request.setEmail("scout1@example.com");
        request.setPassword("password123");
        request.setFirstName("Sam");
        request.setLastName("Scout");
        request.setAge(35);
        request.setPhone("+1234567890");
        request.setAddress("123 Scout St");
        request.setGender(Gender.MALE);
        request.setRegion("Europe");
        request.setOrganizationName("Scouting Inc.");

        updateRequest = new ScoutUpdateRequest();
        updateRequest.setFirstName("Sam");
        updateRequest.setLastName("Scout");
        updateRequest.setAge(35);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 Scout St");
        updateRequest.setGender(Gender.MALE);
        updateRequest.setRegion("Europe");
        updateRequest.setOrganizationName("Scouting Inc.");

        response = ScoutResponse.builder()
                .id(1L)
                .keycloakId("scout-keycloak-1")
                .firstName("Sam")
                .lastName("Scout")
                .age(35)
                .email("scout1@example.com")
                .phone("+1234567890")
                .address("123 Scout St")
                .gender(Gender.MALE)
                .region("Europe")
                .organizationName("Scouting Inc.")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createScout_shouldReturnCreated() {
        given(scoutService.createScout(any(ScoutRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<ScoutResponse>> result = controller.createScout(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(scoutService).createScout(eq(request));
    }

    @Test
    void getScoutById_shouldReturnOk() {
        Long id = 1L;
        given(scoutService.getScoutById(id)).willReturn(response);

        ResponseEntity<ApiResponse<ScoutResponse>> result = controller.getScoutById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(scoutService).getScoutById(id);
    }

    @Test
    void getAllScouts_shouldReturnList() {
        given(scoutService.getAllScouts()).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<ScoutResponse>>> result = controller.getAllScouts();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(scoutService).getAllScouts();
    }

    @Test
    void updateScout_shouldReturnOk() {
        Long id = 1L;
        given(scoutService.updateScout(eq(id), any(ScoutUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<ScoutResponse>> result = controller.updateScout(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(scoutService).updateScout(id, updateRequest);
    }
}
