package com.example.playerservice.service;

import com.example.playerservice.dto.request.SportRequest;
import com.example.playerservice.dto.response.SportResponse;
import com.example.playerservice.model.enums.SportType;

import java.util.List;

public interface SportService {
    SportResponse createSport(SportRequest request);
    SportResponse updateSport(Long id, SportRequest request);
    void deleteSport(Long id);
    SportResponse getSportById(Long id);
    List<SportResponse> getAllSports();
    List<SportResponse> getSportsByType(SportType sportType);
}
