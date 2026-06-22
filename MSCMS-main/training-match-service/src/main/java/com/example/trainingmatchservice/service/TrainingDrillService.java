package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.TrainingDrillRequest;
import com.example.trainingmatchservice.dto.response.TrainingDrillResponse;

import java.util.List;

public interface TrainingDrillService {
    TrainingDrillResponse createTrainingDrill(TrainingDrillRequest request);
    TrainingDrillResponse updateTrainingDrill(Long id, TrainingDrillRequest request);
    void deleteTrainingDrill(Long id);
    TrainingDrillResponse getTrainingDrillById(Long id);
    List<TrainingDrillResponse> getAllTrainingDrills();
}

