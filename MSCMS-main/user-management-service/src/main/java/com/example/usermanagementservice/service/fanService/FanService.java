package com.example.usermanagementservice.service.fanService;

import com.example.usermanagementservice.dto.request.fanReq.FanRequest;
import com.example.usermanagementservice.dto.response.fanRes.FanResponse;
import com.example.usermanagementservice.dto.update.fanUp.FanUpdateRequest;

import java.util.List;

public interface FanService {
    FanResponse createFan(FanRequest request);
    FanResponse getFanById(Long id);
    List<FanResponse> getAllFans();
    FanResponse updateFan(Long id, FanUpdateRequest request);
}