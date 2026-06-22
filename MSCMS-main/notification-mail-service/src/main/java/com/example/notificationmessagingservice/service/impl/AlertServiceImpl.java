package com.example.notificationmessagingservice.service.impl;

import com.example.notificationmessagingservice.dto.request.AlertRequest;
import com.example.notificationmessagingservice.dto.response.AlertResponse;
import com.example.notificationmessagingservice.exception.custom.ResourceNotFoundException;
import com.example.notificationmessagingservice.mapper.AlertMapper;
import com.example.notificationmessagingservice.model.entity.Alert;
import com.example.notificationmessagingservice.repository.AlertRepository;
import com.example.notificationmessagingservice.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final AlertMapper alertMapper;

    @Override
    @Transactional
    public AlertResponse create(AlertRequest request) {
        Alert alert = alertMapper.toEntity(request);
        alert.setTriggeredAt(LocalDateTime.now());
        alert.setIsAcknowledged(false);
        alert.setIsResolved(false);
        return alertMapper.toResponse(alertRepository.save(alert));
    }

    @Override
    @Transactional
    public AlertResponse update(Long id, AlertRequest request) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));
        alertMapper.updateFromRequest(request, alert);
        return alertMapper.toResponse(alertRepository.save(alert));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!alertRepository.existsById(id)) {
            throw new ResourceNotFoundException("Alert not found with id: " + id);
        }
        alertRepository.deleteById(id);
    }

    @Override
    public AlertResponse getById(Long id) {
        return alertMapper.toResponse(alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id)));
    }

    @Override
    public List<AlertResponse> getAll() {
        return alertRepository.findAll().stream()
                .map(alertMapper::toResponse)
                .toList();
    }

    @Override
    public List<AlertResponse> getByTarget(String keycloakId) {
        return alertRepository.findByTargetUserKeycloakId(keycloakId).stream()
                .map(alertMapper::toResponse)
                .toList();
    }

    @Override
    public List<AlertResponse> getUnacknowledged() {
        return alertRepository.findByIsAcknowledgedFalse().stream()
                .map(alertMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AlertResponse acknowledge(Long id, String acknowledgedByKeycloakId) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));
        alert.setIsAcknowledged(true);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setAcknowledgedByUserKeycloakId(acknowledgedByKeycloakId);
        return alertMapper.toResponse(alertRepository.save(alert));
    }

    @Override
    @Transactional
    public AlertResponse resolve(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));
        alert.setIsResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        return alertMapper.toResponse(alertRepository.save(alert));
    }
}
