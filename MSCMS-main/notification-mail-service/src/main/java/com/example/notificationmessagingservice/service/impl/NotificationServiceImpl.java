package com.example.notificationmessagingservice.service.impl;

import com.example.notificationmessagingservice.dto.request.NotificationRequest;
import com.example.notificationmessagingservice.dto.response.NotificationResponse;
import com.example.notificationmessagingservice.exception.custom.ResourceNotFoundException;
import com.example.notificationmessagingservice.mapper.NotificationMapper;
import com.example.notificationmessagingservice.model.entity.Notification;
import com.example.notificationmessagingservice.repository.NotificationRepository;
import com.example.notificationmessagingservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse create(NotificationRequest request) {
        Notification notification = notificationMapper.toEntity(request);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public NotificationResponse update(Long id, NotificationRequest request) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        notificationMapper.updateFromRequest(request, notification);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    @Override
    public NotificationResponse getById(Long id) {
        return notificationMapper.toResponse(notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id)));
    }

    @Override
    public List<NotificationResponse> getAll() {
        return notificationRepository.findAll().stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    public List<NotificationResponse> getByRecipient(String keycloakId) {
        return notificationRepository.findByRecipientUserKeycloakId(keycloakId).stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    public List<NotificationResponse> getUnreadByRecipient(String keycloakId) {
        return notificationRepository.findByRecipientUserKeycloakIdAndIsReadFalse(keycloakId).stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }
}
