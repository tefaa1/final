package com.example.notificationmessagingservice.service;

import com.example.notificationmessagingservice.dto.request.AlertRequest;
import com.example.notificationmessagingservice.dto.response.AlertResponse;
import java.util.List;

public interface AlertService {
    AlertResponse create(AlertRequest request);
    AlertResponse update(Long id, AlertRequest request);
    void delete(Long id);
    AlertResponse getById(Long id);
    List<AlertResponse> getAll();
    List<AlertResponse> getByTarget(String keycloakId);
    List<AlertResponse> getUnacknowledged();
    AlertResponse acknowledge(Long id, String acknowledgedByKeycloakId);
    AlertResponse resolve(Long id);
}
