package com.example.trainingmatchservice.service.impl;

import com.example.trainingmatchservice.dto.request.TrainingSessionRequest;
import com.example.trainingmatchservice.dto.response.TrainingSessionResponse;
import com.example.trainingmatchservice.exception.custom.ResourceNotFoundException;
import com.example.trainingmatchservice.mapper.TrainingSessionMapper;
import com.example.trainingmatchservice.model.training.entity.TrainingSession;
import com.example.trainingmatchservice.repository.TrainingSessionRepository;
import com.example.trainingmatchservice.service.TrainingSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingSessionServiceImpl implements TrainingSessionService {

    private final TrainingSessionRepository trainingSessionRepository;
    private final TrainingSessionMapper trainingSessionMapper;

    @Override
    public TrainingSessionResponse createTrainingSession(TrainingSessionRequest request) {
        TrainingSession session = trainingSessionMapper.toEntity(request);
        return trainingSessionMapper.toResponse(trainingSessionRepository.save(session));
    }

    @Override
    public TrainingSessionResponse updateTrainingSession(Long id, TrainingSessionRequest request) {
        TrainingSession session = getTrainingSession(id);
        trainingSessionMapper.updateFromRequest(request, session);
        return trainingSessionMapper.toResponse(trainingSessionRepository.save(session));
    }

    @Override
    public void deleteTrainingSession(Long id) {
        TrainingSession session = getTrainingSession(id);
        trainingSessionRepository.delete(session);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingSessionResponse getTrainingSessionById(Long id) {
        return trainingSessionMapper.toResponse(getTrainingSession(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingSessionResponse> getAllTrainingSessions() {
        return trainingSessionRepository.findAll()
                .stream()
                .map(trainingSessionMapper::toResponse)
                .toList();
    }

    private TrainingSession getTrainingSession(Long id) {
        return trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training session not found with id " + id));
    }
}

