package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.TrainingSessionRequest;
import com.example.trainingmatchservice.dto.response.TrainingSessionResponse;

import java.util.List;

public interface TrainingSessionService {
    TrainingSessionResponse createTrainingSession(TrainingSessionRequest request);
    TrainingSessionResponse updateTrainingSession(Long id, TrainingSessionRequest request);
    void deleteTrainingSession(Long id);
    TrainingSessionResponse getTrainingSessionById(Long id);
    List<TrainingSessionResponse> getAllTrainingSessions();
}

