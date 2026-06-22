package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.staffRes.StaffMemberResponse;
import com.example.usermanagementservice.dto.response.userRes.StaffStatsResponse;
import com.example.usermanagementservice.dto.update.staffUp.StaffMemberUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.StaffRole;
import com.example.usermanagementservice.service.staffMemberService.StaffMemberService;
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
class StaffControllerTest {

    @Mock
    private StaffMemberService staffMemberService;

    @InjectMocks
    private StaffController controller;

    private StaffMemberRequest request;
    private StaffMemberUpdateRequest updateRequest;
    private StaffMemberResponse response;
    private StaffStatsResponse statsResponse;

    @BeforeEach
    void setUp() {
        request = new StaffMemberRequest();
        request.setUsername("staff1");
        request.setEmail("staff1@example.com");
        request.setPassword("password123");
        request.setFirstName("Jane");
        request.setLastName("Staff");
        request.setAge(35);
        request.setPhone("+1234567890");
        request.setAddress("456 Staff St");
        request.setGender(Gender.FEMALE);
        request.setSportId(1L);
        request.setTeamId(1L);
        request.setStaffRole(StaffRole.HEAD_COACH);
        request.setTeamManagerId(1L);
        request.setYearsExperience(10);
        request.setCoachingLicenseLevel("UEFA Pro");

        updateRequest = new StaffMemberUpdateRequest();
        updateRequest.setFirstName("Jane");
        updateRequest.setLastName("Staff");
        updateRequest.setAge(35);
        updateRequest.setPhone("+1234567890");
        updateRequest.setAddress("456 Staff St");
        updateRequest.setGender(Gender.FEMALE);

        response = StaffMemberResponse.builder()
                .id(1L)
                .keycloakId("staff-keycloak-1")
                .firstName("Jane")
                .lastName("Staff")
                .age(35)
                .email("staff1@example.com")
                .phone("+1234567890")
                .address("456 Staff St")
                .gender(Gender.FEMALE)
                .sportId(1L)
                .teamId(1L)
                .staffRole(StaffRole.HEAD_COACH)
                .teamManagerId(1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        statsResponse = new StaffStatsResponse(
                StaffRole.HEAD_COACH.name(),
                5L
        );
    }

    @Test
    void createStaffMember_shouldReturnCreated() {
        given(staffMemberService.createStaffMember(any(StaffMemberRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<StaffMemberResponse>> result = controller.createStaffMember(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(staffMemberService).createStaffMember(eq(request));
    }

    @Test
    void getStaffMemberById_shouldReturnOk() {
        Long id = 1L;
        given(staffMemberService.getStaffMemberById(id)).willReturn(response);

        ResponseEntity<ApiResponse<StaffMemberResponse>> result = controller.getStaffMemberById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(staffMemberService).getStaffMemberById(id);
    }

    @Test
    void getStaffMembers_withoutRole_shouldReturnAllStaff() {
        given(staffMemberService.getAllStaffMembers()).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<StaffMemberResponse>>> result = controller.getStaffMembers(null);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(staffMemberService).getAllStaffMembers();
    }

    @Test
    void getStaffMembers_withRole_shouldReturnStaffByRole() {
        StaffRole role = StaffRole.HEAD_COACH;
        given(staffMemberService.getStaffByRole(role)).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<StaffMemberResponse>>> result = controller.getStaffMembers(role);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(staffMemberService).getStaffByRole(role);
    }

    @Test
    void getStaffByTeam_shouldReturnOk() {
        Long teamId = 1L;
        given(staffMemberService.getStaffByTeamId(teamId)).willReturn(List.of(response));

        ResponseEntity<ApiResponse<List<StaffMemberResponse>>> result = controller.getStaffByTeam(teamId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(staffMemberService).getStaffByTeamId(teamId);
    }

    @Test
    void updateStaffMember_shouldReturnOk() {
        Long id = 1L;
        given(staffMemberService.updateStaffMember(eq(id), any(StaffMemberUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<StaffMemberResponse>> result = controller.updateStaffMember(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(staffMemberService).updateStaffMember(id, updateRequest);
    }

    @Test
    void getStaffStatsByTeam_shouldReturnOk() {
        Long teamId = 1L;
        given(staffMemberService.getStaffStatsByTeam(teamId)).willReturn(List.of(statsResponse));

        ResponseEntity<ApiResponse<List<StaffStatsResponse>>> result = controller.getStaffStatsByTeam(teamId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(statsResponse);
        verify(staffMemberService).getStaffStatsByTeam(teamId);
    }
}
