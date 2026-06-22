package com.example.notificationmessagingservice.service;

import com.example.notificationmessagingservice.dto.request.NotificationRequest;
import com.example.notificationmessagingservice.dto.response.NotificationResponse;
import java.util.List;

public interface NotificationService {
    NotificationResponse create(NotificationRequest request);
    NotificationResponse update(Long id, NotificationRequest request);
    void delete(Long id);
    NotificationResponse getById(Long id);
    List<NotificationResponse> getAll();
    List<NotificationResponse> getByRecipient(String keycloakId);
    List<NotificationResponse> getUnreadByRecipient(String keycloakId);
    NotificationResponse markAsRead(Long id);
}
