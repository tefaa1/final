package com.example.usermanagementservice.service.sportmanager;

import com.example.usermanagementservice.dto.request.sportManagerReq.SportManagerRequest;
import com.example.usermanagementservice.dto.response.sportMangerRes.SportManagerResponse;
import com.example.usermanagementservice.dto.response.teamManagerRes.TeamManagerResponse;
import com.example.usermanagementservice.dto.update.sportManagerUp.SportManagerUpdateRequest;

import java.util.List;

public interface SportManagerService {
    SportManagerResponse createSportManager(SportManagerRequest request);
    SportManagerResponse getSportManagerById(Long id);
    List<SportManagerResponse> getAllSportManagers();
    SportManagerResponse updateSportManager(Long id, SportManagerUpdateRequest request);
    List<TeamManagerResponse> getTeamManagersBySportManager(Long sportManagerId);
}