package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.nationalTeamReq.NationalTeamRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.nationalTeamReS.NationalTeamResponse;
import com.example.usermanagementservice.dto.update.nationalTeamUp.NationalTeamUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.service.nationalTeamService.NationalTeamService;
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
class NationalTeamControllerTest {

    @Mock
    private NationalTeamService nationalTeamService;

    @InjectMocks
    private NationalTeamController controller;

    private NationalTeamRequest request;
    private NationalTeamUpdateRequest updateRequest;
    private NationalTeamResponse response;

    @BeforeEach
    void setUp() {
        request = new NationalTeamRequest();
        request.setUsername("natteam1");
        request.setEmail("natteam1@example.com");
        request.setPassword("password123");
        request.setFirstName("National");
        request.setLastName("Team");
        request.setAge(0);
        request.setPhone("+1234567890");
        request.setAddress("123 National St");
        request.setGender(Gender.MALE);
        request.setFederationName("National Football Federation");
        request.setContactPerson("John Contact");
        request.setCountry("USA");

        updateRequest = new NationalTeamUpdateRequest();
        updateRequest.setFirstName("National");
        updateRequest.setLastName("Team");
        updateRequest.setAge(0);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 National St");
        updateRequest.setGender(Gender.MALE);
        updateRequest.setFederationName("National Football Federation");
        updateRequest.setContactPerson("John Contact");
        updateRequest.setCountry("USA");

        response = NationalTeamResponse.builder()
                .id(1L)
                .keycloakId("natteam-keycloak-1")
                .firstName("National")
                .lastName("Team")
                .age(0)
                .email("natteam1@example.com")
                .phone("+1234567890")
                .address("123 National St")
                .gender(Gender.MALE)
                .federationName("National Football Federation")
                .contactPerson("John Contact")
                .country("USA")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createNationalTeam_shouldReturnCreated() {
        given(nationalTeamService.createNationalTeam(any(NationalTeamRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<NationalTeamResponse>> result = controller.createNationalTeam(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(nationalTeamService).createNationalTeam(eq(request));
    }

    @Test
    void getNationalTeamById_shouldReturnOk() {
        Long id = 1L;
        given(nationalTeamService.getNationalTeamById(id)).willReturn(response);

        ResponseEntity<ApiResponse<NationalTeamResponse>> result = controller.getNationalTeamById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(nationalTeamService).getNationalTeamById(id);
    }

    @Test
    void getAllNationalTeams_shouldReturnList() {
        given(nationalTeamService.getAllNationalTeams()).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<NationalTeamResponse>>> result = controller.getAllNationalTeams();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(nationalTeamService).getAllNationalTeams();
    }

    @Test
    void updateNationalTeam_shouldReturnOk() {
        Long id = 1L;
        given(nationalTeamService.updateNationalTeam(eq(id), any(NationalTeamUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<NationalTeamResponse>> result = controller.updateNationalTeam(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(nationalTeamService).updateNationalTeam(id, updateRequest);
    }
}
