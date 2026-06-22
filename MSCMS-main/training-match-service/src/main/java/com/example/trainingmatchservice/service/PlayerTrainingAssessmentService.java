package com.example.trainingmatchservice.service;

import com.example.trainingmatchservice.dto.request.PlayerTrainingAssessmentRequest;
import com.example.trainingmatchservice.dto.response.PlayerTrainingAssessmentResponse;

import java.util.List;

public interface PlayerTrainingAssessmentService {
    PlayerTrainingAssessmentResponse createPlayerTrainingAssessment(PlayerTrainingAssessmentRequest request);
    PlayerTrainingAssessmentResponse updatePlayerTrainingAssessment(Long id, PlayerTrainingAssessmentRequest request);
    void deletePlayerTrainingAssessment(Long id);
    PlayerTrainingAssessmentResponse getPlayerTrainingAssessmentById(Long id);
    List<PlayerTrainingAssessmentResponse> getAllPlayerTrainingAssessments();
}

