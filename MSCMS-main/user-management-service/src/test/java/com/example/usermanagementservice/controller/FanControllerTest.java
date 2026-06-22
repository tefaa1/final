package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.fanReq.FanRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.fanRes.FanResponse;
import com.example.usermanagementservice.dto.update.fanUp.FanUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.service.fanService.FanService;
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
class FanControllerTest {

    @Mock
    private FanService fanService;

    @InjectMocks
    private FanController controller;

    private FanRequest request;
    private FanUpdateRequest updateRequest;
    private FanResponse response;

    @BeforeEach
    void setUp() {
        request = new FanRequest();
        request.setUsername("fan1");
        request.setEmail("fan1@example.com");
        request.setPassword("password123");
        request.setFirstName("Frank");
        request.setLastName("Fan");
        request.setAge(22);
        request.setPhone("+1234567890");
        request.setAddress("123 Fan St");
        request.setGender(Gender.MALE);
        request.setDisplayName("SuperFan");
        request.setFavoriteTeamId(1L);

        updateRequest = new FanUpdateRequest();
        updateRequest.setFirstName("Frank");
        updateRequest.setLastName("Fan");
        updateRequest.setAge(22);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 Fan St");
        updateRequest.setGender(Gender.MALE);
        updateRequest.setDisplayName("SuperFan");
        updateRequest.setFavoriteTeamId(1L);

        response = FanResponse.builder()
                .id(1L)
                .keycloakId("fan-keycloak-1")
                .firstName("Frank")
                .lastName("Fan")
                .age(22)
                .email("fan1@example.com")
                .phone("+1234567890")
                .address("123 Fan St")
                .gender(Gender.MALE)
                .displayName("SuperFan")
                .favoriteTeamId(1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createFan_shouldReturnCreated() {
        given(fanService.createFan(any(FanRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<FanResponse>> result = controller.createFan(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(fanService).createFan(eq(request));
    }

    @Test
    void getFanById_shouldReturnOk() {
        Long id = 1L;
        given(fanService.getFanById(id)).willReturn(response);

        ResponseEntity<ApiResponse<FanResponse>> result = controller.getFanById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(fanService).getFanById(id);
    }

    @Test
    void getAllFans_shouldReturnList() {
        given(fanService.getAllFans()).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<FanResponse>>> result = controller.getAllFans();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(fanService).getAllFans();
    }

    @Test
    void updateFan_shouldReturnOk() {
        Long id = 1L;
        given(fanService.updateFan(eq(id), any(FanUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<FanResponse>> result = controller.updateFan(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(fanService).updateFan(id, updateRequest);
    }
}
