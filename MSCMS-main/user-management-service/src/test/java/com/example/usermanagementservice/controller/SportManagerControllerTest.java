package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.sportManagerReq.SportManagerRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.sportMangerRes.SportManagerResponse;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.sportManagerUp.SportManagerUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.service.sportmanager.SportManagerService;
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
class SportManagerControllerTest {

    @Mock
    private SportManagerService sportManagerService;

    @InjectMocks
    private SportManagerController controller;

    private SportManagerRequest request;
    private SportManagerUpdateRequest updateRequest;
    private SportManagerResponse response;

    @BeforeEach
    void setUp() {
        request = new SportManagerRequest();
        request.setUsername("sportmgr1");
        request.setEmail("sportmgr1@example.com");
        request.setPassword("password123");
        request.setFirstName("Alex");
        request.setLastName("SportManager");
        request.setAge(45);
        request.setPhone("+1234567890");
        request.setAddress("123 Sport St");
        request.setGender(Gender.MALE);
        request.setSportId(1L);
        request.setCanManageAllTeams(true);

        updateRequest = new SportManagerUpdateRequest();
        updateRequest.setFirstName("Alex");
        updateRequest.setLastName("SportManager");
        updateRequest.setAge(45);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 Sport St");
        updateRequest.setGender(Gender.MALE);
        updateRequest.setSportId(1L);
        updateRequest.setCanManageAllTeams(true);

        response = SportManagerResponse.builder()
                .id(1L)
                .keycloakId("sportmgr-keycloak-1")
                .firstName("Alex")
                .lastName("SportManager")
                .age(45)
                .email("sportmgr1@example.com")
                .phone("+1234567890")
                .address("123 Sport St")
                .gender(Gender.MALE)
                .sportId(1L)
                .canManageAllTeams(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createSportManager_shouldReturnCreated() {
        given(sportManagerService.createSportManager(any(SportManagerRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<SportManagerResponse>> result = controller.createSportManager(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(sportManagerService).createSportManager(eq(request));
    }

    @Test
    void getSportManagerById_shouldReturnOk() {
        Long id = 1L;
        given(sportManagerService.getSportManagerById(id)).willReturn(response);

        ResponseEntity<ApiResponse<SportManagerResponse>> result = controller.getSportManagerById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(sportManagerService).getSportManagerById(id);
    }

    @Test
    void getAllSportManagers_shouldReturnList() {
        given(sportManagerService.getAllSportManagers()).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<SportManagerResponse>>> result = controller.getAllSportManagers();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(sportManagerService).getAllSportManagers();
    }

    @Test
    void updateSportManager_shouldReturnOk() {
        Long id = 1L;
        given(sportManagerService.updateSportManager(eq(id), any(SportManagerUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<SportManagerResponse>> result = controller.updateSportManager(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(sportManagerService).updateSportManager(id, updateRequest);
    }

    @Test
    void getTeamManagers_shouldReturnList() {
        Long id = 1L;
        TeamManagerResponse tmResponse = TeamManagerResponse.builder()
                .id(1L)
                .keycloakId("tm-keycloak-1")
                .firstName("Team")
                .lastName("Manager")
                .build();
        given(sportManagerService.getTeamManagersBySportManager(id)).willReturn(List.of(tmResponse));

        ResponseEntity<ApiResponse<List<TeamManagerResponse>>> result = controller.getTeamManagers(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(tmResponse);
        verify(sportManagerService).getTeamManagersBySportManager(id);
    }
}
