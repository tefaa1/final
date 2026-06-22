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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management operations")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users (admin only)")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/keycloak/{keycloakId}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUserByKeycloakId(#keycloakId)")
    @Operation(summary = "Get user by Keycloak ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByKeycloakId(@PathVariable String keycloakId) {
        UserResponse user = userService.getUserByKeycloakId(keycloakId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Update user")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request) {
        UserResponse updated = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search users with filters")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Integer minAge,
            @RequestParam(required = false) Integer maxAge) {

        UserSearchCriteria criteria = UserSearchCriteria.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .gender(gender)
                .role(role)
                .minAge(minAge)
                .maxAge(maxAge)
                .build();

        List<UserResponse> users = userService.searchUsers(criteria);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Update user password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @PathVariable Long id,
            @Valid @RequestBody PasswordUpdateRequest request) {
        userService.updatePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password updated successfully"));
    }

    @GetMapping("/stats/by-role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user statistics by role")
    public ResponseEntity<ApiResponse<List<UserStatsResponse>>> getUserStatsByRole() {
        List<UserStatsResponse> stats = userService.getUserStatsByRole();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}