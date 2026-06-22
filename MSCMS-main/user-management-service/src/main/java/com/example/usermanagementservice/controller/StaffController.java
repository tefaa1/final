package com.example.usermanagementservice.controller;
import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.ApiResponse;
import com.example.usermanagementservice.dto.response.staffRes.StaffMemberResponse;
import com.example.usermanagementservice.dto.response.userRes.StaffStatsResponse;
import com.example.usermanagementservice.dto.update.staffUp.StaffMemberUpdateRequest;
import com.example.usermanagementservice.model.enums.StaffRole;
import com.example.usermanagementservice.service.staffMemberService.StaffMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
@Tag(name = "Staff", description = "Staff member operations")
class StaffController {

    private final StaffMemberService staffMemberService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create staff member")
    public ResponseEntity<ApiResponse<StaffMemberResponse>> createStaffMember(
            @Valid @RequestBody StaffMemberRequest request) {
        StaffMemberResponse response = staffMemberService.createStaffMember(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Staff member created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_MANAGER', 'SPORT_MANAGER') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Get staff member by ID")
    public ResponseEntity<ApiResponse<StaffMemberResponse>> getStaffMemberById(@PathVariable Long id) {
        StaffMemberResponse staff = staffMemberService.getStaffMemberById(id);
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER', 'TEAM_MANAGER')")
    @Operation(summary = "Get all staff members or by role")
    public ResponseEntity<ApiResponse<List<StaffMemberResponse>>> getStaffMembers(
            @RequestParam(required = false) StaffRole role) {
        List<StaffMemberResponse> staff = role != null
                ? staffMemberService.getStaffByRole(role)
                : staffMemberService.getAllStaffMembers();
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @GetMapping("/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER', 'TEAM_MANAGER')")
    @Operation(summary = "Get staff members by team ID")
    public ResponseEntity<ApiResponse<List<StaffMemberResponse>>> getStaffByTeam(@PathVariable Long teamId) {
        List<StaffMemberResponse> staff = staffMemberService.getStaffByTeamId(teamId);
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    @Operation(summary = "Update staff member")
    public ResponseEntity<ApiResponse<StaffMemberResponse>> updateStaffMember(
            @PathVariable Long id,
            @Valid @RequestBody StaffMemberUpdateRequest request) {
        StaffMemberResponse updated = staffMemberService.updateStaffMember(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Staff member updated successfully"));
    }

    @GetMapping("/stats/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SPORT_MANAGER', 'TEAM_MANAGER')")
    @Operation(summary = "Get staff statistics by team")
    public ResponseEntity<ApiResponse<List<StaffStatsResponse>>> getStaffStatsByTeam(@PathVariable Long teamId) {
        List<StaffStatsResponse> stats = staffMemberService.getStaffStatsByTeam(teamId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
