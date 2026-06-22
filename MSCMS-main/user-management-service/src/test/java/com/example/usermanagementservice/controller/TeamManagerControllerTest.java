package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.teamMangerReq.AssignStaffRequest;
import com.example.usermanagementservice.dto.request.teamMangerReq.TeamManagerRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.teamManagerUp.TeamManagerUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.service.teamManagerService.TeamManagerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TeamManagerControllerTest {

    @Mock
    private TeamManagerService teamManagerService;

    @InjectMocks
    private TeamManagerController controller;

    private TeamManagerRequest request;
    private TeamManagerUpdateRequest updateRequest;
    private AssignStaffRequest assignStaffRequest;
    private TeamManagerResponse response;

    @BeforeEach
    void setUp() {
        request = new TeamManagerRequest();
        request.setUsername("manager1");
        request.setEmail("manager1@example.com");
        request.setPassword("password123");
        request.setFirstName("Mike");
        request.setLastName("Manager");
        request.setAge(40);
        request.setPhone("+1234567890");
        request.setAddress("123 Manager St");
        request.setGender(Gender.MALE);
        request.setTeamId(1L);
        request.setSportManagerId(1L);
        request.setCanManageAllStaffMembers(true);

        updateRequest = new TeamManagerUpdateRequest();
        updateRequest.setFirstName("Mike");
        updateRequest.setLastName("Manager");
        updateRequest.setAge(40);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("123 Manager St");
        updateRequest.setGender(Gender.MALE);
        updateRequest.setTeamId(1L);
        updateRequest.setCanManageAllStaffMembers(true);

        assignStaffRequest = new AssignStaffRequest();
        assignStaffRequest.setStaffMemberId(5L);

        response = TeamManagerResponse.builder()
                .id(1L)
                .keycloakId("manager-keycloak-1")
                .firstName("Mike")
                .lastName("Manager")
                .age(40)
                .email("manager1@example.com")
                .phone("+1234567890")
                .address("123 Manager St")
                .gender(Gender.MALE)
                .teamId(1L)
                .sportManagerId(1L)
                .canManageAllStaffMembers(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createTeamManager_shouldReturnCreated() {
        given(teamManagerService.createTeamManager(any(TeamManagerRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<TeamManagerResponse>> result = controller.createTeamManager(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(teamManagerService).createTeamManager(eq(request));
    }

    @Test
    void getTeamManagerById_shouldReturnOk() {
        Long id = 1L;
        given(teamManagerService.getTeamManagerById(id)).willReturn(response);

        ResponseEntity<ApiResponse<TeamManagerResponse>> result = controller.getTeamManagerById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(teamManagerService).getTeamManagerById(id);
    }

    @Test
    void updateTeamManager_shouldReturnOk() {
        Long id = 1L;
        given(teamManagerService.updateTeamManager(eq(id), any(TeamManagerUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<TeamManagerResponse>> result = controller.updateTeamManager(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(teamManagerService).updateTeamManager(id, updateRequest);
    }

    @Test
    void assignStaff_shouldReturnOk() {
        Long id = 1L;
        given(teamManagerService.assignStaff(eq(id), any(AssignStaffRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<TeamManagerResponse>> result = controller.assignStaff(id, assignStaffRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(teamManagerService).assignStaff(id, assignStaffRequest);
    }
}
