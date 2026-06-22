package com.example.usermanagementservice.controller;

import com.example.usermanagementservice.dto.request.userReq.PasswordUpdateRequest;
import com.example.usermanagementservice.dto.request.userReq.UserSearchCriteria;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.userRes.UserResponse;
import com.example.usermanagementservice.dto.response.userRes.UserStatsResponse;
import com.example.usermanagementservice.dto.update.userUp.UserUpdateRequest;
import com.example.usermanagementservice.model.enums.Gender;
import com.example.usermanagementservice.model.enums.Role;
import com.example.usermanagementservice.service.userService.UserService;
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
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController controller;

    private UserUpdateRequest updateRequest;
    private UserResponse response;
    private PasswordUpdateRequest passwordUpdateRequest;
    private UserStatsResponse statsResponse;

    @BeforeEach
    void setUp() {
        updateRequest = UserUpdateRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .email("john.doe@example.com")
                .phone("+1234567890")
                .address("123 Main St")
                .gender(Gender.MALE)
                .build();

        response = UserResponse.builder()
                .id(1L)
                .keycloakId("keycloak-id-1")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .email("john.doe@example.com")
                .phone("+1234567890")
                .address("123 Main St")
                .gender(Gender.MALE)
                .role(Role.PLAYER)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        passwordUpdateRequest = new PasswordUpdateRequest(
                "newPassword123"
        );

        statsResponse = new UserStatsResponse(
                Role.PLAYER,
                10L
        );
    }

    @Test
    void getUserById_shouldReturnOk() {
        Long id = 1L;
        given(userService.getUserById(id)).willReturn(response);

        ResponseEntity<ApiResponse<UserResponse>> result = controller.getUserById(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(userService).getUserById(id);
    }

    @Test
    void getUserByKeycloakId_shouldReturnOk() {
        String keycloakId = "keycloak-id-1";
        given(userService.getUserByKeycloakId(keycloakId)).willReturn(response);

        ResponseEntity<ApiResponse<UserResponse>> result = controller.getUserByKeycloakId(keycloakId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(userService).getUserByKeycloakId(keycloakId);
    }

    @Test
    void updateUser_shouldReturnOk() {
        Long id = 1L;
        given(userService.updateUser(eq(id), any(UserUpdateRequest.class))).willReturn(response);

        ResponseEntity<ApiResponse<UserResponse>> result = controller.updateUser(id, updateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).isEqualTo(response);
        verify(userService).updateUser(id, updateRequest);
    }

    @Test
    void deleteUser_shouldReturnOk() {
        Long id = 1L;

        ResponseEntity<ApiResponse<Void>> result = controller.deleteUser(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        verify(userService).deleteUser(id);
    }

    @Test
    void searchUsers_shouldReturnOk() {
        UserSearchCriteria criteria = UserSearchCriteria.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .gender(Gender.MALE)
                .role(Role.PLAYER)
                .minAge(20)
                .maxAge(40)
                .build();

        List<UserResponse> users = List.of(response);
        given(userService.searchUsers(any(UserSearchCriteria.class))).willReturn(users);

        ResponseEntity<ApiResponse<List<UserResponse>>> result = controller.searchUsers(
                "John",
                "Doe",
                "john.doe@example.com",
                Gender.MALE,
                Role.PLAYER,
                20,
                40
        );

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(response);
        verify(userService).searchUsers(any(UserSearchCriteria.class));
    }

    @Test
    void updatePassword_shouldReturnOk() {
        Long id = 1L;

        ResponseEntity<ApiResponse<Void>> result = controller.updatePassword(id, passwordUpdateRequest);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        verify(userService).updatePassword(id, passwordUpdateRequest);
    }

    @Test
    void getUserStatsByRole_shouldReturnOk() {
        List<UserStatsResponse> stats = List.of(statsResponse);
        given(userService.getUserStatsByRole()).willReturn(stats);

        ResponseEntity<ApiResponse<List<UserStatsResponse>>> result = controller.getUserStatsByRole();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getData()).containsExactly(statsResponse);
        verify(userService).getUserStatsByRole();
    }
}
