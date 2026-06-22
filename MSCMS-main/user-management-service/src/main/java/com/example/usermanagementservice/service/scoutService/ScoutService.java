package com.example.usermanagementservice.service.scoutService;

import com.example.usermanagementservice.dto.request.scoutReq.ScoutRequest;
import com.example.usermanagementservice.dto.response.scoutRes.ScoutResponse;
import com.example.usermanagementservice.dto.update.scoutUp.ScoutUpdateRequest;

import java.util.List;

public interface ScoutService {
    ScoutResponse createScout(ScoutRequest request);
    ScoutResponse getScoutById(Long id);
    List<ScoutResponse> getAllScouts();
    ScoutResponse updateScout(Long id, ScoutUpdateRequest request);
}
