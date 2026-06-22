package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.TrainingPlanRequest;
import com.example.trainingmatchservice.dto.response.TrainingPlanResponse;

import java.util.List;

public interface TrainingPlanService {
    TrainingPlanResponse createTrainingPlan(TrainingPlanRequest request);
    TrainingPlanResponse updateTrainingPlan(Long id, TrainingPlanRequest request);
    void deleteTrainingPlan(Long id);
    TrainingPlanResponse getTrainingPlanById(Long id);
    List<TrainingPlanResponse> getAllTrainingPlans();
}

