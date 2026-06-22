package com.example.usermanagementservice.service.teamManagerService;

import com.example.usermanagementservice.dto.request.teamMangerReq.AssignStaffRequest;
import com.example.usermanagementservice.dto.request.teamMangerReq.TeamManagerRequest;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.teamManagerUp.TeamManagerUpdateRequest;

public interface TeamManagerService {
    TeamManagerResponse createTeamManager(TeamManagerRequest request);
    TeamManagerResponse getTeamManagerById(Long id);
    TeamManagerResponse updateTeamManager(Long id, TeamManagerUpdateRequest request);
    TeamManagerResponse assignStaff(Long teamManagerId, AssignStaffRequest request);
}