package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.PlayerTrainingAssessmentRequest;
import com.example.trainingmatchservice.dto.response.PlayerTrainingAssessmentResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.PlayerTrainingAssessmentMapper;
import com.example.trainingmatchservice.model.training.entity.PlayerTrainingAssessment;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import com.example.trainingmatchservice.repository.PlayerTrainingAssessmentRepository;
import com.example.trainingmatchservice.repository.TrainingSessionRepository;
import com.example.trainingmatchservice.service.PlayerTrainingAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlayerTrainingAssessmentServiceImpl implements PlayerTrainingAssessmentService {

    private final PlayerTrainingAssessmentRepository playerTrainingAssessmentRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final PlayerTrainingAssessmentMapper playerTrainingAssessmentMapper;

    @Override
    public PlayerTrainingAssessmentResponse createPlayerTrainingAssessment(PlayerTrainingAssessmentRequest request) {
        TrainingSession session = getTrainingSession(request.trainingSessionId());
        PlayerTrainingAssessment assessment = playerTrainingAssessmentMapper.toEntity(request);
        assessment.setTrainingSession(session);
        return playerTrainingAssessmentMapper.toResponse(playerTrainingAssessmentRepository.save(assessment));
    }

    @Override
    public PlayerTrainingAssessmentResponse updatePlayerTrainingAssessment(Long id, PlayerTrainingAssessmentRequest request) {
        PlayerTrainingAssessment assessment = getAssessment(id);
        if (request.trainingSessionId() != null) {
            assessment.setTrainingSession(getTrainingSession(request.trainingSessionId()));
        }
        playerTrainingAssessmentMapper.updateFromRequest(request, assessment);
        return playerTrainingAssessmentMapper.toResponse(playerTrainingAssessmentRepository.save(assessment));
    }

    @Override
    public void deletePlayerTrainingAssessment(Long id) {
        PlayerTrainingAssessment assessment = getAssessment(id);
        playerTrainingAssessmentRepository.delete(assessment);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerTrainingAssessmentResponse getPlayerTrainingAssessmentById(Long id) {
        return playerTrainingAssessmentMapper.toResponse(getAssessment(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerTrainingAssessmentResponse> getAllPlayerTrainingAssessments() {
        return playerTrainingAssessmentRepository.findAll()
                .stream()
                .map(playerTrainingAssessmentMapper::toResponse)
                .toList();
    }

    private PlayerTrainingAssessment getAssessment(Long id) {
        return playerTrainingAssessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player training assessment not found with id " + id));
    }

    private TrainingSession getTrainingSession(Long id) {
        return trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training session not found with id " + id));
    }
}

