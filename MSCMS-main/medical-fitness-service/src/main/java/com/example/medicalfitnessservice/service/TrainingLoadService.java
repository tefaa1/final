package com.example.medicalfitnessservice.service;

import com.example.medicalfitnessservice.dto.request.TrainingLoadRequest;
import com.example.medicalfitnessservice.dto.response.TrainingLoadResponse;

import java.util.List;

public interface TrainingLoadService {
    TrainingLoadResponse createTrainingLoad(TrainingLoadRequest request);
    TrainingLoadResponse updateTrainingLoad(Long id, TrainingLoadRequest request);
    void deleteTrainingLoad(Long id);
    TrainingLoadResponse getTrainingLoadById(Long id);
    List<TrainingLoadResponse> getAllTrainingLoads();
}

