package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.InjuryRequest;
import com.example.medicalfitnessservice.dto.response.InjuryResponse;

import java.util.List;

public interface InjuryService {
    InjuryResponse createInjury(InjuryRequest request);
    InjuryResponse updateInjury(Long id, InjuryRequest request);
    void deleteInjury(Long id);
    InjuryResponse getInjuryById(Long id);
    List<InjuryResponse> getAllInjuries();
}

