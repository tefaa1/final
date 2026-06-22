package com.example.playerservice.service;

import com.example.playerservice.dto.request.RosterRequest;
import com.example.playerservice.dto.response.RosterResponse;

import java.util.List;

public interface RosterService {
    RosterResponse createRoster(RosterRequest request);
    RosterResponse updateRoster(Long id, RosterRequest request);
    void deleteRoster(Long id);
    RosterResponse getRosterById(Long id);
    List<RosterResponse> getAllRosters();
}

