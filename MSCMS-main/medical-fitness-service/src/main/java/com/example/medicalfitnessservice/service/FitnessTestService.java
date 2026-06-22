package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.FitnessTestRequest;
import com.example.medicalfitnessservice.dto.response.FitnessTestResponse;
import com.example.medicalfitnessservice.model.enums.SportType;

import java.util.List;


public interface FitnessTestService {
    FitnessTestResponse createFitnessTest(FitnessTestRequest request);
    FitnessTestResponse updateFitnessTest(Long id, FitnessTestRequest request);
    void deleteFitnessTest(Long id);
    FitnessTestResponse getFitnessTestById(Long id);
    List<FitnessTestResponse> getAllFitnessTests();
    List<FitnessTestResponse> getFitnessTestsBySportType(SportType sportType);
}

