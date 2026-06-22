package com.example.usermanagementservice.service.staffMemberService;

import com.example.usermanagementservice.dto.request.staffReq.StaffMemberRequest;
import com.example.usermanagementservice.dto.response.staffRes.StaffMemberResponse;
import com.example.usermanagementservice.dto.response.userRes.StaffStatsResponse;
import com.example.usermanagementservice.dto.update.staffUp.StaffMemberUpdateRequest;
import com.example.usermanagementservice.model.enums.StaffRole;

import java.util.List;

public interface StaffMemberService {
    StaffMemberResponse createStaffMember(StaffMemberRequest request);
    StaffMemberResponse getStaffMemberById(Long id);
    List<StaffMemberResponse> getAllStaffMembers();
    List<StaffMemberResponse> getStaffByTeamId(Long teamId);
    List<StaffMemberResponse> getStaffByRole(StaffRole role);
    StaffMemberResponse updateStaffMember(Long id, StaffMemberUpdateRequest request);
    List<StaffStatsResponse> getStaffStatsByTeam(Long teamId);
}